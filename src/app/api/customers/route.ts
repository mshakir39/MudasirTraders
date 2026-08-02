import { NextRequest } from 'next/server';
import {
  getCustomers,
  getCustomersPaginated,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/actions/customerActions';
import { CUSTOMERS_BATCH_SIZE } from '@/lib/customersQuery';
import {
  passThroughResponse,
  errorResponse,
  validationErrorResponse,
} from '@/utils/apiResponse';
import { validateCustomerData } from '@/utils/validators';
import { handleApiError } from '@/utils/errorHandler';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerType = searchParams.get('customerType') || undefined;
    const search = searchParams.get('search') || undefined;
    const all = searchParams.get('all') === 'true';

    // Full list for autocomplete / invoice pickers
    if (all) {
      const result = await getCustomers(customerType);
      return passThroughResponse(result);
    }

    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(
      200,
      Math.max(1, Number(searchParams.get('limit') || CUSTOMERS_BATCH_SIZE))
    );

    const result = await getCustomersPaginated(page, limit, {
      customerType,
      search,
    });
    return passThroughResponse(result);
  } catch (error: any) {
    const errorResult = handleApiError(error, 'GET /api/customers');
    return errorResponse(errorResult.error, errorResult.statusCode);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { customerName, phoneNumber, address, email } = await req.json();

    // Validate customer data using improved validator
    const validation = validateCustomerData({
      customerName,
      phoneNumber,
      address,
      email,
    });

    if (!validation.isValid) {
      return validationErrorResponse(validation.errors);
    }

    const customerData = {
      customerName,
      phoneNumber,
      address: address || '',
      email: email || '',
    };

    const result = await createCustomer(customerData);
    return passThroughResponse(result);
  } catch (error: any) {
    const errorResult = handleApiError(error, 'POST /api/customers');
    return errorResponse(errorResult.error, errorResult.statusCode);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return validationErrorResponse(['Customer ID is required']);
    }

    // Validate customer data if provided
    if (data.customerName || data.phoneNumber) {
      const validation = validateCustomerData({
        customerName: data.customerName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        email: data.email,
      });

      if (!validation.isValid) {
        return validationErrorResponse(validation.errors);
      }
    }

    const result = await updateCustomer(id, data);
    return passThroughResponse(result);
  } catch (error: any) {
    const errorResult = handleApiError(error, 'PUT /api/customers');
    return errorResponse(errorResult.error, errorResult.statusCode);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return validationErrorResponse(['Customer ID is required']);
    }

    const result = await deleteCustomer(id);
    return passThroughResponse(result);
  } catch (error: any) {
    const errorResult = handleApiError(error, 'DELETE /api/customers');
    return errorResponse(errorResult.error, errorResult.statusCode);
  }
}
