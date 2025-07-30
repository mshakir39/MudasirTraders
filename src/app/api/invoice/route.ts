'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { getAllSum } from '@/utils/getTotalSum';
import { ObjectId } from 'mongodb';

export async function POST(req: any, res: any) {
  const formData = await req.json();
  try {
    const lastInvoice: any = await executeOperation('invoices', 'findLast');
    let nextInvoiceNumber;
    if (lastInvoice && typeof lastInvoice === 'object') {
      const lastInvoiceNumber = lastInvoice.invoiceNo;
      const numericPart = lastInvoiceNumber.replace(/^.*?(\d+)$/, '$1'); // Extract the numeric part
      nextInvoiceNumber = `0000000${parseInt(numericPart) + 1}`; // Increment the numeric part
    } else {
      nextInvoiceNumber = '00000001'; // Start with 1 if no invoices exist
    }

    // Create an invoice document
    const invoice: any = {
      invoiceNo: nextInvoiceNumber,
      customerName: formData.customerName,
      customerAddress: formData.customerAddress,
      customerContactNumber: formData.customerContactNumber,
      customerType: formData.customerType || 'WalkIn Customer', // Add customer type
      customerId: formData.customerType === 'Regular' ? formData.customerId : null, // Add customerId for regular customers
      vehicleNo: formData.vehicleNo,
      paymentMethod: formData.paymentMethod,
      batteriesCountAndWeight: formData?.batteriesCountAndWeight,
      batteriesRate: formData?.batteriesRate,
      receivedAmount: formData?.receivedAmount,

      products: formData.productDetail.map((product: any) => ({
        brandName: product.brandName,
        series: product.series,
        productPrice: product.productPrice,
        quantity: product.quantity,
        warrentyCode: product.warrentyCode,
        warrentyStartDate: product.warrentyStartDate,
        warrentyEndDate: product.warrentyEndDate,
        totalPrice: product.productPrice * product.quantity,
        batteryDetails: product.batteryDetails,
      })),
      createdDate: (formData.useCustomDate === true && formData.customDate) ? new Date(formData.customDate) : new Date(),
    };

    invoice.remainingAmount =
      formData?.receivedAmount > formData?.batteriesRate
        ? getAllSum(invoice.products, 'totalPrice') -
          formData?.batteriesRate -
          formData?.receivedAmount
        : getAllSum(invoice.products, 'totalPrice') -
          formData?.receivedAmount -
          formData?.batteriesRate;

    // Update stock quantities and sold counts
    for (const product of formData.productDetail) {
      const seriesName = product.batteryDetails?.name || product.series;
      const stockQuery = {
        'seriesStock.series': seriesName,
      };

      // First check if the stock exists
      const stockExists = await executeOperation(
        'stock',
        'findOne',
        stockQuery
      );

      if (!stockExists) {
        throw new Error(`Series '${seriesName}' not found in stock.`);
      }

      // Update the stock quantity and increment sold count
      await executeOperation('stock', 'updateStockAndSoldCount', {
        series: seriesName,
        quantity: product.quantity,
      });
    }

    // Insert the invoice into the database
    await executeOperation('invoices', 'insertOne', invoice);

    // Insert a sales record into the sales collection
    await executeOperation('sales', 'insertOne', {
      invoiceId: invoice.invoiceNo,
      date: invoice.createdDate,
      customerName: invoice.customerName,
      products: invoice.products,
      totalAmount: getAllSum(invoice.products, 'totalPrice'),
      paymentMethod: invoice.paymentMethod,
    });

    return Response.json({ message: 'Invoice created successfully' });
  } catch (err: any) {
    return Response.json({ error: err.message });
  }
}

export async function PATCH(req: any, res: any) {
  try {
    const { additionalPayment, paymentMethod, id } = await req.json();

    const invoiceId = new ObjectId(id);
    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceId,
    });

    if (
      typeof invoice === 'object' &&
      invoice !== null &&
      'remainingAmount' in invoice
    ) {
      const remainingAmount = invoice.remainingAmount;
      const newPayment = {
        addedDate: new Date(),
        amount: additionalPayment,
        paymentMethod: paymentMethod,
      };

      const updatedInvoice = {
        ...invoice,
        additionalPayment: [...(invoice.additionalPayment || []), newPayment],
        remainingAmount: remainingAmount - additionalPayment,
      };

      await executeOperation('invoices', 'updateOne', updatedInvoice);

      return Response.json({ message: 'Invoice updated successfully' });
    } else {
      return Response.json({ error: 'Invalid Invoice' });
    }
  } catch (err: any) {
    return Response.json({ error: err.message });
  }
}
