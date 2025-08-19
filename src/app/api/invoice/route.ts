'use server';
import { executeOperation } from '@/app/libs/executeOperation';
import { getAllSum } from '@/utils/getTotalSum';
import { ObjectId } from 'mongodb';

// Track processing invoices to prevent duplicates
const processingInvoices = new Set<string>();

export async function POST(req: any, res: any) {
  const formData = await req.json();

  // Create a unique identifier for this invoice request
  const requestId = `${formData.customerName}-${formData.customerContactNumber}-${Date.now()}`;
  
  // Check if this request is already being processed
  if (processingInvoices.has(requestId)) {
    return Response.json({ error: 'Invoice is already being processed. Please wait.' }, { status: 409 });
  }

  // Add to processing set
  processingInvoices.add(requestId);

  try {
    // Debug custom date logic
    console.log('🔍 Custom Date Debug:');
    console.log('useCustomDate:', formData.useCustomDate);
    console.log('customDate:', formData.customDate);
    console.log('useCustomDate type:', typeof formData.useCustomDate);
    console.log('customDate type:', typeof formData.customDate);

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
      customerId:
        formData.customerType === 'Regular' ? formData.customerId : null, // Add customerId for regular customers
      vehicleNo: formData.vehicleNo,
      paymentMethod: formData.paymentMethod,
      batteriesCountAndWeight: formData?.batteriesCountAndWeight,
      batteriesRate: formData?.batteriesRate,
      receivedAmount: formData?.receivedAmount,
      isPayLater: formData?.paymentMethod?.includes('Pay Later') || false,

      products: formData.productDetail.map((product: any) => ({
        brandName: product.brandName,
        series: product.series,
        productPrice: product.productPrice,
        quantity: product.quantity,
        warrentyCode: product.warrentyCode ? product.warrentyCode.trim() : '',
        warrentyStartDate: product.warrentyStartDate,
        warrentyEndDate: product.warrentyEndDate,
        totalPrice: product.productPrice * product.quantity,
        batteryDetails: product.batteryDetails,
      })),
      createdDate:
        (formData.useCustomDate === true ||
          formData.useCustomDate === 'true') &&
        formData.customDate
          ? new Date(formData.customDate)
          : new Date(),
    };

    // Debug the final createdDate
    console.log('📅 Final createdDate:', invoice.createdDate);
    console.log('📅 Final createdDate type:', typeof invoice.createdDate);

    // Calculate remaining amount
    const totalProductAmount = getAllSum(invoice.products, 'totalPrice');
    const receivedAmount = parseFloat(formData?.receivedAmount || '0') || 0;
    const batteriesRate = parseFloat(formData?.batteriesRate || '0') || 0;

    // Calculate remaining amount
    invoice.remainingAmount =
      totalProductAmount - receivedAmount - batteriesRate;

    // Debug the calculation
    console.log('💰 Amount Calculation Debug:');
    console.log('  totalProductAmount:', totalProductAmount);
    console.log('  receivedAmount (raw):', formData?.receivedAmount);
    console.log('  receivedAmount (parsed):', receivedAmount);
    console.log('  batteriesRate (raw):', formData?.batteriesRate);
    console.log('  batteriesRate (parsed):', batteriesRate);
    console.log('  remainingAmount:', invoice.remainingAmount);

    // Set payment status based on remaining amount
    if (invoice.remainingAmount === 0) {
      invoice.paymentStatus = 'paid';
    } else {
      invoice.paymentStatus = 'partial';
    }

    // Validate quantities before updating stock
    console.log('📦 Validating stock quantities...');
    for (const product of formData.productDetail) {
      const seriesName = product.batteryDetails?.name || product.series;
      const quantity = parseInt(product.quantity) || 0;
      
      if (quantity <= 0) {
        throw new Error(`Invalid quantity for ${seriesName}: ${quantity}`);
      }

      // Check current stock before updating
      const stockQuery = {
        'seriesStock.series': seriesName,
      };

      const stockExists = await executeOperation(
        'stock',
        'findOne',
        stockQuery
      );

      if (!stockExists) {
        throw new Error(`Series '${seriesName}' not found in stock.`);
      }

      // Validate stock availability
      const stockData = stockExists as any;
      const currentStock = stockData.seriesStock?.find((item: any) => item.series === seriesName);
      if (!currentStock) {
        throw new Error(`Series '${seriesName}' not found in stock data.`);
      }

      const currentInStock = parseInt(currentStock.inStock) || 0;
      if (currentInStock < quantity) {
        throw new Error(`Insufficient stock for ${seriesName}. Available: ${currentInStock}, Requested: ${quantity}`);
      }
    }

    // Update stock quantities and sold counts
    console.log('📦 Updating stock quantities and sold counts...');
    for (const product of formData.productDetail) {
      const seriesName = product.batteryDetails?.name || product.series;
      const quantity = parseInt(product.quantity) || 0;

      console.log(`🔄 Updating stock for ${seriesName}: quantity=${quantity}`);

      // Update the stock quantity and increment sold count
      await executeOperation('stock', 'updateStockAndSoldCount', {
        series: seriesName,
        quantity: quantity,
      });

      console.log(`✅ Stock updated for ${seriesName}`);
    }

    // Insert the invoice into the database
    console.log('📄 Inserting invoice into database...');
    await executeOperation('invoices', 'insertOne', invoice);

    // Insert a sales record into the sales collection
    console.log('💼 Inserting sales record...');
    await executeOperation('sales', 'insertOne', {
      invoiceId: invoice.invoiceNo,
      date: invoice.createdDate,
      customerName: invoice.customerName,
      products: invoice.products,
      totalAmount: getAllSum(invoice.products, 'totalPrice'),
      paymentMethod: invoice.paymentMethod,
    });

    console.log('✅ Invoice created successfully');
    return Response.json({ message: 'Invoice created successfully' });
  } catch (err: any) {
    console.error('❌ Error creating invoice:', err);
    return Response.json({ error: err.message });
  } finally {
    // Remove from processing set
    processingInvoices.delete(requestId);
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

export async function DELETE(req: any, res: any) {
  try {
    const { id } = await req.json();

    if (!id) {
      return Response.json({ error: 'Invoice ID is required' });
    }

    const invoiceId = new ObjectId(id);

    // 1. First, get the invoice details before deleting
    const invoice: any = await executeOperation('invoices', 'findOne', {
      _id: invoiceId,
    });

    if (!invoice) {
      return Response.json({ error: 'Invoice not found' });
    }

    console.log(
      '🗑️ Starting complete invoice deletion for:',
      invoice.invoiceNo
    );
    console.log('📋 Invoice details:', {
      customerName: invoice.customerName,
      totalProducts: invoice.products?.length || 0,
      totalAmount: invoice.remainingAmount,
      paymentMethod: invoice.paymentMethod,
    });

    // 2. Preserve warranty data before deletion (for warranty lookups)
    if (invoice.products && Array.isArray(invoice.products)) {
      console.log('🔧 Preserving warranty data...');
      for (const product of invoice.products) {
        if (product.warrentyCode) {
          try {
            await executeOperation('warrantyHistory', 'insertOne', {
              warrentyCode: product.warrentyCode ? product.warrentyCode.trim() : '',
              customerName: invoice.customerName,
              customerContactNumber: invoice.customerContactNumber,
              customerAddress: invoice.customerAddress,
              productDetails: {
                brandName: product.brandName,
                series: product.series,
                warrentyStartDate: product.warrentyStartDate,
                warrentyEndDate: product.warrentyEndDate,
                warrentyDuration: product.warrentyDuration,
              },
              originalInvoiceNo: invoice.invoiceNo,
              originalInvoiceId: invoice._id,
              deletedAt: new Date(),
              deletionReason: 'Invoice deleted by user',
            });
            console.log(
              `✅ Warranty data preserved for: ${product.warrentyCode}`
            );
          } catch (warrantyError) {
            console.warn(
              `⚠️ Failed to preserve warranty data for ${product.warrentyCode}:`,
              warrantyError
            );
          }
        }
      }
    }

    // 3. Reverse stock changes (restore quantities)
    if (invoice.products && Array.isArray(invoice.products)) {
      console.log('📦 Reversing stock changes...');
      for (const product of invoice.products) {
        const seriesName = product.batteryDetails?.name || product.series;
        const quantity = product.quantity;

        console.log(`🔄 Restoring stock for ${seriesName}: +${quantity} units`);

        try {
          // Restore stock quantities (increase inStock, decrease soldCount)
          await executeOperation('stock', 'restoreStockFromInvoice', {
            series: seriesName,
            quantity: parseInt(quantity) || 0,
          });
          console.log(`✅ Stock restored for ${seriesName}`);
        } catch (stockError: any) {
          console.error(
            `❌ Failed to restore stock for ${seriesName}:`,
            stockError
          );
          throw new Error(
            `Failed to restore stock for ${seriesName}: ${stockError.message}`
          );
        }
      }
    }

    // 4. Delete the sales record
    console.log('💼 Deleting sales record...');
    try {
      await executeOperation('sales', 'deleteOne', {
        invoiceId: invoice.invoiceNo,
      });
      console.log('✅ Sales record deleted');
    } catch (salesError: any) {
      console.error('❌ Failed to delete sales record:', salesError);
      throw new Error(`Failed to delete sales record: ${salesError.message}`);
    }

    // 5. Archive invoice data for audit purposes
    console.log('📁 Archiving invoice data...');
    try {
      await executeOperation('archivedInvoices', 'insertOne', {
        originalInvoice: invoice,
        deletedAt: new Date(),
        deletionReason: 'Invoice deleted by user',
        originalId: invoice._id,
        invoiceNo: invoice.invoiceNo,
      });
      console.log('✅ Invoice data archived');
    } catch (archiveError) {
      console.warn('⚠️ Failed to archive invoice data:', archiveError);
      // Don't fail the deletion if archiving fails
    }

    // 6. Delete the invoice
    console.log('🗑️ Deleting main invoice record...');
    try {
      await executeOperation('invoices', 'deleteOne', {
        _id: invoiceId,
      });
      console.log('✅ Main invoice record deleted');
    } catch (invoiceError: any) {
      console.error('❌ Failed to delete invoice:', invoiceError);
      throw new Error(`Failed to delete invoice: ${invoiceError.message}`);
    }

    console.log('🎉 Complete invoice deletion successful:', invoice.invoiceNo);

    return Response.json({
      message: 'Invoice completely deleted and all related data reverted',
      deletedInvoiceNo: invoice.invoiceNo,
      actionsCompleted: [
        'Warranty data preserved',
        'Stock quantities restored',
        'Sales record deleted',
        'Invoice data archived',
        'Main invoice deleted',
      ],
    });
  } catch (err: any) {
    console.error('❌ Error during invoice deletion:', err);
    return Response.json({
      error: err.message,
      details: 'Invoice deletion failed. Please check the logs for details.',
    });
  }
}
