import { useState, useEffect } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const taxRates = {
  general: 0.18,
  materials: 0.28,
  services: 0.12
}

function App() {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [invoiceItems, setInvoiceItems] = useState([
    { id: 1, description: '', quantity: 0, price: 0, category: 'general', isAutoDetected: false }
  ])
  const [subtotal, setSubtotal] = useState(0)
  const [totalGST, setTotalGST] = useState(0)

  const calculateItemTotal = (quantity, price) => {
    return (Number(quantity) || 0) * (Number(price) || 0)
  }

  const autoDetectCategory = (description) => {
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes('cement') || lowerDesc.includes('steel')) {
      return 'materials'
    } else if (lowerDesc.includes('consulting')) {
      return 'services'
    } else {
      return 'general'
    }
  }

  useEffect(() => {
    let calculatedSubtotal = 0
    let calculatedGST = 0

    invoiceItems.forEach((item) => {
      const itemTotal = calculateItemTotal(item.quantity, item.price)
      calculatedSubtotal += itemTotal
      const rate = taxRates[item.category] !== undefined ? taxRates[item.category] : taxRates.general
      calculatedGST += itemTotal * rate
    })

    setSubtotal(calculatedSubtotal)
    setTotalGST(calculatedGST)
  }, [invoiceItems])

  const handleItemChange = (id, field, value) => {
    setInvoiceItems(
      invoiceItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === 'description') {
            const detected = autoDetectCategory(value)
            updatedItem.category = detected
            updatedItem.isAutoDetected = detected !== 'general' || value.trim() !== ''
          }
          if (field === 'category') {
            updatedItem.isAutoDetected = false
          }
          return updatedItem
        }
        return item
      })
    )
  }

  const addItem = () => {
    const newItem = {
      id: invoiceItems.length > 0 ? invoiceItems[invoiceItems.length - 1].id + 1 : 1,
      description: '',
      quantity: 0,
      price: 0,
      category: 'general',
      isAutoDetected: false
    }
    setInvoiceItems([...invoiceItems, newItem])
  }

  const removeItem = (id) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((item) => item.id !== id))
    }
  }

  const generatePDF = () => {
    try {
      const doc = new jsPDF()

      doc.setFontSize(22)
      doc.text('Invoice', 14, 20)

      doc.setFontSize(11)
      doc.text(`Invoice Number: ${invoiceNumber || 'N/A'}`, 14, 28)
      doc.text(`Date: ${invoiceDate || 'N/A'}`, 14, 35)

      doc.text('Client Information:', 14, 45)
      doc.text(`Name: ${clientName || 'N/A'}`, 14, 52)
      doc.text(`Address: ${clientAddress || 'N/A'}`, 14, 59)

      const tableColumns = ['Description', 'Category', 'Qty', 'Price', 'Total']
      const tableRows = invoiceItems.map((item) => {
        const itemTotal = calculateItemTotal(item.quantity, item.price)
        return [
          item.description || '',
          item.category.charAt(0).toUpperCase() + item.category.slice(1),
          item.quantity,
          `$${Number(item.price || 0).toFixed(2)}`,
          `$${itemTotal.toFixed(2)}`
        ]
      })

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 68,
      })

      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 75

      doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 14, finalY + 10)
      doc.text(`Total GST: $${totalGST.toFixed(2)}`, 14, finalY + 18)
      doc.text(`Grand Total: $${grandTotal.toFixed(2)}`, 14, finalY + 26)

      doc.save('invoice.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please check the console for details.')
    }
  }

  const grandTotal = subtotal + totalGST

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-8 border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-100">
          Invoice Generator
        </h1>
        
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-001"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Invoice Date</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        {/* Client Information */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Client Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Client Name</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Client Address</label>
              <textarea
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                placeholder="Client address"
                rows="3"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Invoice Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Description</th>
                  <th className="pb-3 pr-4">Category</th>
                  <th className="pb-3 pr-4">Quantity</th>
                  <th className="pb-3 pr-4">Price</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoiceItems.map((item) => {
                  const total = calculateItemTotal(item.quantity, item.price)
                  return (
                    <tr key={item.id} className="align-middle">
                      <td className="py-3 pr-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-col gap-1">
                          <select
                            value={item.category}
                            onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                          >
                            {Object.keys(taxRates).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)} ({taxRates[cat] * 100}%)
                              </option>
                            ))}
                          </select>
                          {item.isAutoDetected && (
                            <span className="text-[10px] text-emerald-600 font-medium">Auto-detected</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pr-4 w-28">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          min="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4 w-32">
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4 font-medium text-slate-800 text-sm">
                        ${total.toFixed(2)}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={invoiceItems.length === 1}
                          className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm"
          >
            Add New Item
          </button>
        </div>

        {/* Totals Section */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 flex flex-col items-end space-y-2">
          <div className="flex justify-between w-full md:w-72 text-sm text-slate-600">
            <span>Subtotal:</span>
            <span className="font-medium text-slate-800">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full md:w-72 text-sm text-slate-600">
            <span>Total GST:</span>
            <span className="font-medium text-slate-800">${totalGST.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full md:w-72 text-base font-bold text-slate-900 border-t border-slate-300 pt-2">
            <span>Grand Total:</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Export Button */}
        <div className="mb-10">
          <button
            type="button"
            onClick={generatePDF}
            className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm"
          >
            Export as PDF
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-300 shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-slate-800">Invoice Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm text-slate-700">
            <div>
              <p><strong>Invoice Number:</strong> {invoiceNumber || 'N/A'}</p>
              <p><strong>Invoice Date:</strong> {invoiceDate || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Client Name:</strong> {clientName || 'N/A'}</p>
              <p><strong>Client Address:</strong> {clientAddress || 'N/A'}</p>
            </div>
          </div>
          <div className="border-t border-slate-200 pt-4 flex flex-col items-end space-y-1 text-sm text-slate-800">
            <p><strong>Subtotal:</strong> ${subtotal.toFixed(2)}</p>
            <p><strong>Total GST:</strong> ${totalGST.toFixed(2)}</p>
            <p className="text-base font-bold text-slate-900"><strong>Grand Total:</strong> ${grandTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
