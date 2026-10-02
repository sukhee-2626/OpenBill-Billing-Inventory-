const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

function convertBelowThousand(num: number): string {
  if (num === 0) return ''
  
  let result = ''
  
  if (num >= 100) {
    result += ones[Math.floor(num / 100)] + ' Hundred '
    num %= 100
  }
  
  if (num >= 10 && num < 20) {
    result += teens[num - 10] + ' '
  } else {
    if (num >= 20) {
      result += tens[Math.floor(num / 10)] + ' '
      num %= 10
    }
    if (num > 0) {
      result += ones[num] + ' '
    }
  }
  
  return result.trim()
}

export function amountToWords(amount: number, currency = 'INR'): string {
  if (amount === 0) return 'Zero'
  
  const [intPart, decPart] = amount.toFixed(2).split('.')
  const num = parseInt(intPart)
  
  if (num === 0) return 'Zero'
  
  // Indian numbering system
  if (currency === 'INR') {
    let result = ''
    
    const crore = Math.floor(num / 10000000)
    const lakh = Math.floor((num % 10000000) / 100000)
    const thousand = Math.floor((num % 100000) / 1000)
    const hundred = num % 1000
    
    if (crore > 0) result += convertBelowThousand(crore) + ' Crore '
    if (lakh > 0) result += convertBelowThousand(lakh) + ' Lakh '
    if (thousand > 0) result += convertBelowThousand(thousand) + ' Thousand '
    if (hundred > 0) result += convertBelowThousand(hundred)
    
    result = result.trim() + ' Rupees'
    
    if (decPart && parseInt(decPart) > 0) {
      result += ' and ' + convertBelowThousand(parseInt(decPart)) + ' Paise'
    }
    
    return result + ' Only'
  }
  
  // International numbering
  const billion = Math.floor(num / 1000000000)
  const million = Math.floor((num % 1000000000) / 1000000)
  const thousand = Math.floor((num % 1000000) / 1000)
  const remainder = num % 1000
  
  let result = ''
  if (billion > 0) result += convertBelowThousand(billion) + ' Billion '
  if (million > 0) result += convertBelowThousand(million) + ' Million '
  if (thousand > 0) result += convertBelowThousand(thousand) + ' Thousand '
  if (remainder > 0) result += convertBelowThousand(remainder)
  
  return result.trim() + ' Only'
}
