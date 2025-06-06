'use client';

import {
  Card as MUICard,
  CardProps as MUICardProps,
  CardContent as MUICardContent,
  CardContentProps as MUICardContentProps,
  CardHeader as MUICardHeader,
  CardHeaderProps as MUICardHeaderProps,
  CardActions as MUICardActions,
  CardActionsProps as MUICardActionsProps,
  Typography
} from '@mui/material';
import React from 'react';

const Card = React.forwardRef<HTMLDivElement, MUICardProps>(
  ({ children, ...props }, ref) => {
    return (
      <MUICard ref={ref} {...props}>
        {children}
      </MUICard>
    );
  }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, MUICardHeaderProps>(
  ({ title, subheader, ...props }, ref) => {
    return (
      <MUICardHeader 
        ref={ref}
        title={title} 
        subheader={subheader}
        {...props} 
      />
    );
  }
);
CardHeader.displayName = 'CardHeader';

const CardContent = React.forwardRef<HTMLDivElement, MUICardContentProps>(
  ({ children, ...props }, ref) => {
    return (
      <MUICardContent ref={ref} {...props}>
        {children}
      </MUICardContent>
    );
  }
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, MUICardActionsProps>(
  ({ children, ...props }, ref) => {
    return (
      <MUICardActions ref={ref} {...props}>
        {children}
      </MUICardActions>
    );
  }
);
CardFooter.displayName = 'CardFooter';

const CardTitle = React.forwardRef<HTMLHeadingElement, React.ComponentProps<typeof Typography>>(
  ({ children, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="h5" component="h2" {...props}>
        {children}
      </Typography>
    );
  }
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<typeof Typography>>(
  ({ children, ...props }, ref) => {
    return (
      <Typography ref={ref} variant="body2" color="text.secondary" {...props}>
        {children}
      </Typography>
    );
  }
);
CardDescription.displayName = 'CardDescription';

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription
};