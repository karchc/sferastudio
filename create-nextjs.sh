#!/bin/bash
cd /workspaces/test-engine
rm -rf my-nextjs-app

# Create Next.js app with automated responses
npx create-next-app@latest my-nextjs-app << EOF
Yes
Yes
Yes
Yes
Yes
No
@/*
EOF