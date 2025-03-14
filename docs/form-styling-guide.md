# MUI Form Styling Guide

This guide explains how to use the standardized MUI form styling system in the AESPT application.

## Overview

We've implemented a consistent styling system for all MUI form components across the application. This ensures that all forms have a uniform appearance and behavior, improving the user experience and making the code more maintainable.

## Key Features

- Consistent styling for all MUI form components (TextField, Select, Autocomplete, etc.)
- Standardized spacing, colors, and typography
- Responsive design that works on all screen sizes
- Accessibility improvements
- Support for different form field states (focus, error, disabled)

## How to Use

### Basic Form Fields

All MUI form components will automatically use the standardized styling. Simply use the components as you normally would:

```tsx
import { TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

// TextField example
<TextField
  label="Product Name"
  name="productName"
  value={formData.productName}
  onChange={handleChange}
  error={!!errors.productName}
  helperText={errors.productName}
/>

// Select example
<FormControl>
  <InputLabel id="category-label">Category</InputLabel>
  <Select
    labelId="category-label"
    name="category"
    value={formData.category}
    onChange={handleChange}
    label="Category"
  >
    <MenuItem value="electronics">Electronics</MenuItem>
    <MenuItem value="clothing">Clothing</MenuItem>
    <MenuItem value="food">Food</MenuItem>
  </Select>
</FormControl>
```

### Form Buttons

For buttons that need to align properly with form fields, use the `FormButton` component:

```tsx
import { FormButton } from '@/app/shared/components/form-utils';

// Standard height button (matches regular form fields)
<FormButton
  variant="contained"
  color="primary"
  onClick={handleSubmit}
>
  Submit
</FormButton>

// Small height button (matches small form fields)
<FormButton
  small
  variant="outlined"
  color="secondary"
  onClick={handleCancel}
>
  Cancel
</FormButton>
```

### Error Messages

For consistent error message display, use the `ErrorMessage` component:

```tsx
import { ErrorMessage } from '@/app/shared/components/form-utils';

<ErrorMessage message={errors.fieldName} />;
```

## CSS Variables

The styling system uses CSS variables that can be found in `app/globals.css`. These variables ensure consistency and make it easy to update the styling globally:

```css
:root {
  --mui-primary: #1976d2;
  --mui-primary-light: #4791db;
  --mui-primary-dark: #115293;
  --mui-error: #d32f2f;
  --mui-error-light: #ef5350;
  --mui-success: #2e7d32;
  --mui-text-primary: rgba(0, 0, 0, 0.87);
  --mui-text-secondary: rgba(0, 0, 0, 0.6);
  --mui-border: rgba(0, 0, 0, 0.23);
  --mui-border-hover: rgba(0, 0, 0, 0.87);
  --mui-bg-default: #ffffff;
  --mui-bg-disabled: rgba(0, 0, 0, 0.12);
}
```

## Best Practices

1. Always use the MUI components for form fields (don't mix with native HTML inputs)
2. Use the `FormButton` component for buttons that need to align with form fields
3. Use the `ErrorMessage` component for displaying validation errors
4. Keep form layouts consistent across the application
5. Use the `size="small"` prop for form fields in dense layouts
6. Group related form fields together using appropriate layout components

## Troubleshooting

If you encounter styling issues with MUI form components:

1. Check that the component is properly imported from '@mui/material'
2. Verify that the component is being used correctly according to the MUI documentation
3. Inspect the component using browser developer tools to see if any custom styles are overriding the standardized styles
4. Check for any inline styles that might be conflicting with the standardized styles

## Example Form

Here's a complete example of a form using the standardized styling:

```tsx
import { TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { FormButton, ErrorMessage } from '@/app/shared/components/form-utils';

function ProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Form submission logic
  };

  return (
    <div className="space-y-4">
      <TextField
        label="Product Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
      />

      <FormControl>
        <InputLabel id="category-label">Category</InputLabel>
        <Select
          labelId="category-label"
          name="category"
          value={formData.category}
          onChange={handleChange}
          label="Category"
          error={!!errors.category}
        >
          <MenuItem value="electronics">Electronics</MenuItem>
          <MenuItem value="clothing">Clothing</MenuItem>
          <MenuItem value="food">Food</MenuItem>
        </Select>
        <ErrorMessage message={errors.category} />
      </FormControl>

      <TextField
        label="Price"
        name="price"
        type="number"
        value={formData.price}
        onChange={handleChange}
        error={!!errors.price}
        helperText={errors.price}
        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
      />

      <TextField
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={4}
        error={!!errors.description}
        helperText={errors.description}
      />

      <div className="flex gap-4 pt-4">
        <FormButton variant="contained" color="primary" onClick={handleSubmit}>
          Save Product
        </FormButton>

        <FormButton variant="outlined" color="inherit" onClick={handleCancel}>
          Cancel
        </FormButton>
      </div>
    </div>
  );
}
```
