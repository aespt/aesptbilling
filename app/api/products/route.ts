import { desc, eq, sql, or, ilike, and, ne } from 'drizzle-orm';
import { type InferInsertModel } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { db } from '@/lib/drizzle';
import { ProductsTable } from '@/lib/models/products';
import { CreateProductSchema, UpdateProductSchema } from '@/lib/schemas/productSchema';

export async function GET(request: Request) {
  try {
    // Get URL parameters for pagination and search
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Calculate offset based on page and limit
    const offset = (page - 1) * limit;

    // Build the query conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(ilike(ProductsTable.partNo, `%${search}%`), ilike(ProductsTable.name, `%${search}%`))
      );
    }

    // Count total products for pagination info
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(ProductsTable)
      .where(conditions.length > 0 ? conditions[0] : undefined);

    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    // Fetch paginated products from the database
    const products = await db
      .select()
      .from(ProductsTable)
      .where(conditions.length > 0 ? conditions[0] : undefined)
      .orderBy(desc(ProductsTable.created_at))
      .limit(limit)
      .offset(offset);

    return NextResponse.json(
      {
        products,
        pagination: {
          total: totalCount,
          totalPages,
          currentPage: page,
          pageSize: limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    // Validate the input using Zod schema
    const validatedData = CreateProductSchema.parse(body);

    // Check if part number already exists
    const existingProduct = await db
      .select()
      .from(ProductsTable)
      .where(eq(ProductsTable.partNo, validatedData.part_no))
      .limit(1);

    if (existingProduct.length > 0) {
      return NextResponse.json(
        { error: 'Product with this part number already exists' },
        { status: 409 }
      );
    }

    // Convert price to string for decimal type if needed
    const priceValue =
      typeof validatedData.price === 'number'
        ? validatedData.price.toString()
        : validatedData.price;

    // Ensure it's a valid decimal string
    if (priceValue === null || isNaN(parseFloat(priceValue))) {
      return NextResponse.json({ error: 'Invalid price value' }, { status: 400 });
    }

    // Insert the new product into the database
    const newProduct = await db
      .insert(ProductsTable)
      .values({
        partNo: validatedData.part_no,
        name: validatedData.name,
        description: validatedData.description,
        price: priceValue,
        mrp: validatedData.mrp?.toString(),
        count: validatedData.count,
        brand: validatedData.brand || null,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        message: 'Product created successfully',
        product: newProduct[0],
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating product:', error);

    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    // Ensure we have an ID for the update
    if (!body.id) {
      return NextResponse.json({ error: 'Product ID is required for updates' }, { status: 400 });
    }

    // Validate the input using Zod schema for updates
    const validatedData = UpdateProductSchema.parse(body);

    // If part_no is being updated, check if it's unique
    if (validatedData.part_no !== undefined) {
      const existingProduct = await db
        .select()
        .from(ProductsTable)
        .where(and(eq(ProductsTable.partNo, validatedData.part_no), ne(ProductsTable.id, body.id)))
        .limit(1);

      if (existingProduct.length > 0) {
        return NextResponse.json(
          { error: 'Product with this part number already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: Partial<InferInsertModel<typeof ProductsTable>> = {};

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
      const priceValue =
        typeof validatedData.price === 'number'
          ? validatedData.price.toString()
          : validatedData.price;

      // Ensure it's a valid decimal string
      if (priceValue !== null && !isNaN(parseFloat(priceValue))) {
        updateData.price = priceValue;
      }
    }

    if (validatedData.brand !== undefined) {
      updateData.brand = validatedData.brand;
    }

    if (validatedData.mrp !== undefined) {
      // Convert mrp to string for decimal type if needed
      const mrpValue =
        typeof validatedData.mrp === 'number' ? validatedData.mrp.toString() : validatedData.mrp;

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
    const updatedProduct = await db
      .update(ProductsTable)
      .set(updateData)
      .where(eq(ProductsTable.id, body.id))
      .returning();

    if (updatedProduct.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        message: 'Product updated successfully',
        product: updatedProduct[0],
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error updating product:', error);

    // Check if it's a validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}
