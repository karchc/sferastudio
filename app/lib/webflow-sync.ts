/**
 * Webflow CMS Sync Service
 *
 * Syncs featured tests from Supabase to Webflow CMS collection
 * for marketing website display.
 *
 * Required environment variables:
 * - WEBFLOW_API_TOKEN: Your Webflow API token
 * - WEBFLOW_SITE_ID: Your Webflow site ID
 * - WEBFLOW_COLLECTION_ID: The collection ID for featured tests
 * - WEBFLOW_CATEGORIES_COLLECTION_ID: The collection ID for test categories
 */

const WEBFLOW_API_BASE = 'https://api.webflow.com/v2';

// Webflow collection IDs
const CATEGORIES_COLLECTION_ID = '691fc5d2b3f22920414bbc5c';

interface WebflowConfig {
  apiToken: string;
  siteId: string;
  collectionId: string;
}

interface Category {
  id: string;
  name: string;
}

interface FeaturedTest {
  id: string;
  title: string;
  description?: string;
  time_limit: number;
  question_count?: number;
  price?: number;
  categories?: Category[];
}

interface WebflowItem {
  id: string;
  fieldData: {
    name: string;
    slug: string;
    [key: string]: unknown;
  };
}

interface SyncResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
  details: {
    action: 'created' | 'updated' | 'deleted' | 'error';
    testTitle: string;
    webflowItemId?: string;
    error?: string;
  }[];
}

/**
 * Get Webflow configuration from environment variables
 */
export function getWebflowConfig(): WebflowConfig | null {
  const apiToken = process.env.WEBFLOW_API_TOKEN;
  const siteId = process.env.WEBFLOW_SITE_ID;
  const collectionId = process.env.WEBFLOW_COLLECTION_ID;

  if (!apiToken || !siteId || !collectionId) {
    return null;
  }

  return { apiToken, siteId, collectionId };
}

/**
 * Check if Webflow sync is configured
 */
export function isWebflowConfigured(): boolean {
  return getWebflowConfig() !== null;
}

/**
 * Make authenticated request to Webflow API
 */
async function webflowRequest(
  endpoint: string,
  config: WebflowConfig,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${WEBFLOW_API_BASE}${endpoint}`;

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      'accept': 'application/json',
      ...options.headers,
    },
  });
}

/**
 * Get all items from a Webflow collection
 */
async function getCollectionItems(config: WebflowConfig): Promise<WebflowItem[]> {
  const response = await webflowRequest(
    `/collections/${config.collectionId}/items`,
    config
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch collection items: ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a new item in Webflow collection
 */
async function createCollectionItem(
  config: WebflowConfig,
  test: FeaturedTest,
  categoryMap: Map<string, string>
): Promise<{ id: string }> {
  const fieldData = mapTestToWebflowFields(test, categoryMap);

  const response = await webflowRequest(
    `/collections/${config.collectionId}/items`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        fieldData,
        isArchived: false,
        isDraft: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create item: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Update an existing item in Webflow collection
 */
async function updateCollectionItem(
  config: WebflowConfig,
  itemId: string,
  test: FeaturedTest,
  categoryMap: Map<string, string>
): Promise<void> {
  const fieldData = mapTestToWebflowFields(test, categoryMap);

  const response = await webflowRequest(
    `/collections/${config.collectionId}/items/${itemId}`,
    config,
    {
      method: 'PATCH',
      body: JSON.stringify({
        fieldData,
        isArchived: false,
        isDraft: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update item: ${error}`);
  }
}

/**
 * Set is-featured to false for an item (instead of deleting)
 */
async function unfeatureCollectionItem(
  config: WebflowConfig,
  itemId: string
): Promise<void> {
  const response = await webflowRequest(
    `/collections/${config.collectionId}/items/${itemId}`,
    config,
    {
      method: 'PATCH',
      body: JSON.stringify({
        fieldData: {
          'is-featured': false,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to unfeature item: ${error}`);
  }
}

/**
 * Publish collection items to make them live
 */
async function publishCollectionItems(
  config: WebflowConfig,
  itemIds: string[]
): Promise<void> {
  if (itemIds.length === 0) return;

  const response = await webflowRequest(
    `/collections/${config.collectionId}/items/publish`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        itemIds,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to publish items: ${error}`);
  }
}

/**
 * Get all items from the categories collection
 */
async function getCategoryItems(config: WebflowConfig): Promise<WebflowItem[]> {
  const response = await webflowRequest(
    `/collections/${CATEGORIES_COLLECTION_ID}/items`,
    config
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch category items: ${error}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Create a category in Webflow
 */
async function createCategoryItem(
  config: WebflowConfig,
  category: Category
): Promise<{ id: string }> {
  // Let Webflow auto-generate the slug
  const response = await webflowRequest(
    `/collections/${CATEGORIES_COLLECTION_ID}/items`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        fieldData: {
          name: category.name,
          'supabase-id': category.id,
        },
        isArchived: false,
        isDraft: false,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create category: ${error}`);
  }

  const data = await response.json();
  return { id: data.id };
}

/**
 * Publish category items
 */
async function publishCategoryItems(
  config: WebflowConfig,
  itemIds: string[]
): Promise<void> {
  if (itemIds.length === 0) return;

  const response = await webflowRequest(
    `/collections/${CATEGORIES_COLLECTION_ID}/items/publish`,
    config,
    {
      method: 'POST',
      body: JSON.stringify({
        itemIds,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to publish categories: ${error}`);
  }
}

/**
 * Sync categories to Webflow and return a map of Supabase ID -> Webflow ID
 */
export async function syncCategoriesToWebflow(
  categories: Category[]
): Promise<Map<string, string>> {
  const categoryMap = new Map<string, string>();

  const config = getWebflowConfig();
  if (!config) {
    throw new Error('Webflow is not configured');
  }

  // Get existing Webflow categories
  const existingCategories = await getCategoryItems(config);

  // Create map of supabase-id to Webflow item
  const webflowCategoryMap = new Map<string, WebflowItem>();
  for (const item of existingCategories) {
    const supabaseId = item.fieldData['supabase-id'] as string;
    if (supabaseId) {
      webflowCategoryMap.set(supabaseId, item);
      categoryMap.set(supabaseId, item.id);
    }
  }

  // Create missing categories
  const categoriesToPublish: string[] = [];
  for (const category of categories) {
    if (!webflowCategoryMap.has(category.id)) {
      try {
        const newItem = await createCategoryItem(config, category);
        categoryMap.set(category.id, newItem.id);
        categoriesToPublish.push(newItem.id);
      } catch (error) {
        console.error(`Failed to create category "${category.name}":`, error);
      }
    }
  }

  // Publish new categories
  if (categoriesToPublish.length > 0) {
    await publishCategoryItems(config, categoriesToPublish);
  }

  return categoryMap;
}

/**
 * Map test data to Webflow collection fields
 *
 * Field mapping for "Practice Tests" collection:
 * - name: Test title (required by Webflow)
 * - slug: Auto-generated by Webflow from name
 * - supabase-id: Original test ID for tracking
 * - short-description: Test description
 * - duration: Time limit in minutes (PlainText)
 * - number-of-questions: Number of questions
 * - price: Test price
 * - category: Array of Webflow category IDs (MultiReference)
 */
function mapTestToWebflowFields(
  test: FeaturedTest,
  categoryMap: Map<string, string>
): Record<string, unknown> {
  // Map Supabase category IDs to Webflow category IDs
  const webflowCategoryIds: string[] = [];
  if (test.categories) {
    for (const category of test.categories) {
      const webflowId = categoryMap.get(category.id);
      if (webflowId) {
        webflowCategoryIds.push(webflowId);
      }
    }
  }

  // Let Webflow auto-generate the slug from name
  return {
    name: test.title,
    'supabase-id': test.id,
    'short-description': test.description || '',
    'duration': String(Math.round(test.time_limit / 60)), // Convert seconds to minutes, as string for PlainText field
    'number-of-questions': test.question_count || 0,
    'price': test.price || 0,
    'category': webflowCategoryIds,
    'test-link-2': `https://app.practiceerp.eu/test/${test.id}`,
    'preview-link': `https://app.practiceerp.eu/preview-test/${test.id}`,
    'is-featured': true,
  };
}

/**
 * Sync featured tests to Webflow collection
 *
 * This function:
 * 1. Fetches all featured tests from Supabase
 * 2. Fetches existing items from Webflow collection
 * 3. Creates new items for tests not in Webflow
 * 4. Updates existing items that have changed
 * 5. Deletes items for tests that are no longer featured
 * 6. Publishes all changes
 *
 * @param featuredTests - Array of featured tests from Supabase
 * @param categoryMap - Map of Supabase category ID -> Webflow category ID
 */
export async function syncFeaturedTestsToWebflow(
  featuredTests: FeaturedTest[],
  categoryMap: Map<string, string>
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
    details: [],
  };

  const config = getWebflowConfig();
  if (!config) {
    result.success = false;
    result.errors.push('Webflow is not configured. Please set WEBFLOW_API_TOKEN, WEBFLOW_SITE_ID, and WEBFLOW_COLLECTION_ID environment variables.');
    return result;
  }

  try {
    // Get existing Webflow items
    const existingItems = await getCollectionItems(config);

    // Create map of supabase-id to Webflow item
    const webflowItemMap = new Map<string, WebflowItem>();
    for (const item of existingItems) {
      const supabaseId = item.fieldData['supabase-id'] as string;
      if (supabaseId) {
        webflowItemMap.set(supabaseId, item);
      }
    }

    // Track IDs to publish
    const itemsToPublish: string[] = [];

    // Process each featured test
    for (const test of featuredTests) {
      const existingItem = webflowItemMap.get(test.id);

      try {
        if (existingItem) {
          // Update existing item
          await updateCollectionItem(config, existingItem.id, test, categoryMap);
          itemsToPublish.push(existingItem.id);
          result.updated++;
          result.details.push({
            action: 'updated',
            testTitle: test.title,
            webflowItemId: existingItem.id,
          });
          // Remove from map so we know it's still featured
          webflowItemMap.delete(test.id);
        } else {
          // Create new item
          const newItem = await createCollectionItem(config, test, categoryMap);
          itemsToPublish.push(newItem.id);
          result.created++;
          result.details.push({
            action: 'created',
            testTitle: test.title,
            webflowItemId: newItem.id,
          });
        }
      } catch (error) {
        result.errors.push(`Failed to sync "${test.title}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.details.push({
          action: 'error',
          testTitle: test.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Unfeature items that are no longer featured (set is-featured to false instead of deleting)
    for (const [supabaseId, item] of webflowItemMap) {
      // Skip if already unfeatured
      if (item.fieldData['is-featured'] === false) {
        continue;
      }
      try {
        await unfeatureCollectionItem(config, item.id);
        itemsToPublish.push(item.id);
        result.deleted++; // Using deleted count for unfeatured items
        result.details.push({
          action: 'deleted', // 'deleted' means unfeatured in this context
          testTitle: item.fieldData.name || supabaseId,
          webflowItemId: item.id,
        });
      } catch (error) {
        result.errors.push(`Failed to unfeature item "${item.fieldData.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.details.push({
          action: 'error',
          testTitle: item.fieldData.name || supabaseId,
          webflowItemId: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Publish all changes
    if (itemsToPublish.length > 0) {
      try {
        await publishCollectionItems(config, itemsToPublish);
      } catch (error) {
        result.errors.push(`Failed to publish items: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.errors.length === 0;

  } catch (error) {
    result.success = false;
    result.errors.push(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
