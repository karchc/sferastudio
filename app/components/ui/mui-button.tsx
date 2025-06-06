'use client';

import { Button as MUIButton, ButtonProps as MUIButtonProps } from '@mui/material';
import React from 'react';

export interface ButtonProps extends MUIButtonProps {
  // Add any additional props here
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'contained', color = 'primary', ...props }, ref) => {
    return (
      <MUIButton ref={ref} variant={variant} color={color} {...props}>
        {children}
      </MUIButton>
    );
  }
);

Button.displayName = 'Button';

export { Button };