import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { ProductsTable } from '@/lib/models/products';
import { desc, eq } from 'drizzle-orm';
import { CreateProductSchema, UpdateProductSchema } from '@/lib/schemas/productSchema';
import { ZodError } from 'zod';

export async function GET() {
  try {
    // Fetch all products from the database, ordered by most recent first
    const products = await db
      .select()
      .from(ProductsTable)
      .orderBy(desc(ProductsTable.created_at));

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the input using Zod schema
    const validatedData = CreateProductSchema.parse(body);
    
    // Convert price to string for decimal type if needed
    const priceValue = typeof validatedData.price === 'number' 
      ? validatedData.price.toString() 
      : validatedData.price;
    
    // Ensure it's a valid decimal string
    if (priceValue === null || isNaN(parseFloat(priceValue))) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      );
    }
    
    // Insert the new product into the database
    const newProduct = await db.insert(ProductsTable).values({
      partNo: validatedData.part_no,
      name: validatedData.name,
      description: validatedData.description,
      price: priceValue,
      mrp: validatedData.mrp?.toString(),
      count: validatedData.count,
      created_at: new Date(),
      updated_at: new Date(),
    }).returning();
    
    return NextResponse.json({ 
      message: 'Product created successfully',
      product: newProduct[0]
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    
    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Ensure we have an ID for the update
    if (!body.id) {
      return NextResponse.json(
        { error: 'Product ID is required for updates' },
        { status: 400 }
      );
    }
    
    // Validate the input using Zod schema for updates
    const validatedData = UpdateProductSchema.parse(body);
    
    // Prepare update data
    const updateData: any = {};
    
    // Only include fields that are provided in the request
    if (validatedData.part_no !== undefined) {
      updateData.partNo = validatedData.part_no;
    }
    
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    
    if (validatedData.price !== undefined) {
      // Convert price to string for decimal type if needed
      const priceValue = typeof validatedData.price === 'number' 
        ? validatedData.price.toString() 
        : validatedData.price;
      
      // Ensure it's a valid decimal string
      if (priceValue !== null && !isNaN(parseFloat(priceValue))) {
        updateData.price = priceValue;
      }
    }
    
    if (validatedData.mrp !== undefined) {
      // Convert mrp to string for decimal type if needed
      const mrpValue = typeof validatedData.mrp === 'number' 
        ? validatedData.mrp.toString() 
        : validatedData.mrp;
      
      // Ensure it's a valid decimal string
      if (mrpValue !== null && !isNaN(parseFloat(mrpValue))) {
        updateData.mrp = mrpValue;
      }
    }
    
    if (validatedData.count !== undefined) {
      updateData.count = validatedData.count;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();
    
    // Update the product in the database
    const updatedProduct = await db.update(ProductsTable)
      .set(updateData)
      .where(eq(ProductsTable.id, body.id))
      .returning();
    
    if (updatedProduct.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Product updated successfully',
      product: updatedProduct[0]
    }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    
    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
} 