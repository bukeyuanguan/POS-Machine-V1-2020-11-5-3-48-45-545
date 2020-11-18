import { loadAllItems, loadPromotions } from './Dependencies'
interface PurchaseTag {
  barcode: string,
  quantity: number
}
interface ReceiptTag {
  barcode: string,
  name: string,
  unit: string,
  price: number,
  quantity: number,
  promotion: string,
  subtotal: number,
  discountPrice: number
}
function getPurchaseTags(tags: string[]): PurchaseTag[] {
  const output: PurchaseTag[] = []
  tags.forEach(tag => {
    const tagQuantity = getTagQuantity(tag)
    const tagCode = getTagCode(tag)
    let index = -1
    if (output.length > 0) {
      index = output.findIndex(item => item.barcode === tagCode)
    }
    if (index === -1 || output.length === 0) {
      const purchaseTag: PurchaseTag = {
        barcode: tagCode,
        quantity: tagQuantity
      }
      output.push(purchaseTag)
    }
    else {
      output[index].quantity += tagQuantity
    }
  })
  return output
}

function getTagQuantity(tag: string): number {
  let quantity = 1
  if (tag.indexOf('-') !== (-1)) {
    quantity = parseFloat(tag.split('-')[1])
  }
  return quantity
}
function getTagCode(tag: string): string {
  let code = tag
  if (tag.indexOf('-') !== (-1)) {
    code = tag.split('-')[0]
  }
  return code
}
function getReceiptTags(tags: string[]): ReceiptTag[] {
  const purchaseTags = getPurchaseTags(tags)
  const receiptItems: ReceiptTag[] = []
  const allItemRecord = loadAllItems()
  purchaseTags.forEach(element => {
    const findItem = allItemRecord.find(item => { return item.barcode === element.barcode })
    if (findItem !== undefined) {
      const purchaseItem = {
        barcode: findItem.barcode,
        name: findItem.name,
        unit: element.quantity > 1 ? findItem.unit + 's' : findItem.unit,
        price: findItem.price,
        quantity: element.quantity,
        promotion: getPromotionType(element.barcode),
        discountPrice: getDiscountPrice(element),
        subtotal: getSubtotalPrice(element)
      }
      receiptItems.push(purchaseItem)
    }
  })
  return receiptItems
}
function getSubtotalPrice(purchaseTag: PurchaseTag): number {
  const code = purchaseTag.barcode
  const quantity = purchaseTag.quantity
  const price = getUnitPrice(code)
  const totalPrice = price * quantity
  const discountPrice = getDiscountPrice(purchaseTag)
  return totalPrice - discountPrice
}
function getDiscountPrice(purchaseTag: PurchaseTag): number {
  const code = purchaseTag.barcode
  let quantity = purchaseTag.quantity
  const price = getUnitPrice(code)
  const totalPrice = price * quantity
  const promotionType = getPromotionType(code)
  if (promotionType === 'BUY_TWO_GET_ONE_FREE') {
    quantity = (quantity % 3) + Math.floor(quantity / 3) * 2
  }
  const subtotalPrice = quantity * price
  return totalPrice - subtotalPrice
}
function getUnitPrice(code: string): number {
  let itemPrice = 0
  const allItemRecord = loadAllItems()
  const item = allItemRecord.find(item => item.barcode === code)
  if (item !== undefined) {
    itemPrice = item.price
  }
  return itemPrice
}
function getPromotionType(code: string): string {
  let promotionType = ''
  const allPromotions = loadPromotions()
  allPromotions.forEach(item => {
    item.barcodes.forEach(itemCode => {
      if (itemCode === code) {
        promotionType = item.type
      }
    })
  })
  return promotionType
}
function formatReceipt(receiptTags: ReceiptTag[]): string {
  let printReceipt = '***<store earning no money>Receipt ***\n'
  let totalPrice = 0
  let discountPrice = 0
  receiptTags.forEach(item => {
    const receiptColumn = `Name：${item.name}，Quantity：${item.quantity} ${item.unit}，Unit：${item.price.toFixed(2)}(yuan)，Subtotal：${item.subtotal.toFixed(2)}(yuan)\n`
    printReceipt += receiptColumn
    totalPrice += item.subtotal
    discountPrice += item.discountPrice
  })
  printReceipt += '----------------------\n'
  printReceipt += `Total：${totalPrice.toFixed(2)}(yuan)\n`
  printReceipt += `Discounted prices：${discountPrice.toFixed(2)}(yuan)\n`
  printReceipt += '**********************'
  return printReceipt
}
export function printReceipt(tags: string[]): string {
  const receiptTages = getReceiptTags(tags)
  const formattedReceipt = formatReceipt(receiptTages)
  return formattedReceipt
  //   return `***<store earning no money>Receipt ***
  // Name：Sprite，Quantity：5 bottles，Unit：3.00(yuan)，Subtotal：12.00(yuan)
  // Name：Litchi，Quantity：2.5 pounds，Unit：15.00(yuan)，Subtotal：37.50(yuan)
  // Name：Instant Noodles，Quantity：3 bags，Unit：4.50(yuan)，Subtotal：9.00(yuan)
  // ----------------------
  // Total：58.50(yuan)
  // Discounted prices：7.50(yuan)
  // **********************`
}
