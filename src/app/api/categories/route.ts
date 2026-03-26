'use server';
import { 
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategory,
  appendSeriesToCategory
} from '@/actions/categoryActions';

export async function GET() {
  try {
    const result = await getCategories();
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: any, res: any) {
  try {
    const body = await req.json();
    const result = await createCategory(body);
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: any, res: any) {
  try {
    const { id, ...data } = await req.json();
    
    if (!id) {
      return Response.json({ error: 'Category ID is required' }, { status: 400 });
    }
    
    const result = await updateCategory(id, data);
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: any, res: any) {
  try {
    const { id } = await req.json();
    
    if (!id) {
      return Response.json({ error: 'Category ID is required' }, { status: 400 });
    }
    
    const result = await deleteCategory(id);
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
