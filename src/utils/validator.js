import { VALIDATION } from "../config/constants"

class Validator {
  // Basic Validations
  validateEmail(email) {
    if (!email) {
      throw new Error("Email is required")
    }

    if (!VALIDATION.EMAIL_REGEX.test(email)) {
      throw new Error("Please enter a valid email address")
    }

    return true
  }

  validatePassword(password) {
    if (!password) {
      throw new Error("Password is required")
    }

    if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
      throw new Error(`Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`)
    }

    // Check for at least one uppercase, one lowercase, and one number
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new Error("Password must contain at least one uppercase letter, one lowercase letter, and one number")
    }

    return true
  }

  validateName(name) {
    if (!name) {
      throw new Error("Name is required")
    }

    if (name.trim().length < VALIDATION.NAME_MIN_LENGTH) {
      throw new Error(`Name must be at least ${VALIDATION.NAME_MIN_LENGTH} characters long`)
    }

    // Check for valid characters (letters, spaces, hyphens, apostrophes)
    if (!/^[a-zA-Z\s\-']+$/.test(name)) {
      throw new Error("Name can only contain letters, spaces, hyphens, and apostrophes")
    }

    return true
  }

  validatePhone(phone) {
    if (!phone) {
      throw new Error("Phone number is required")
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '')
    
    if (!VALIDATION.PHONE_REGEX.test(phone) || digitsOnly.length < 10) {
      throw new Error("Please enter a valid phone number (minimum 10 digits)")
    }

    return true
  }

  validateRole(role) {
    const validRoles = ["nanny", "employer"]

    if (!role) {
      throw new Error("Role is required")
    }

    if (!validRoles.includes(role)) {
      throw new Error("Invalid role selected")
    }

    return true
  }

  // Date and Time Validations
  validateDate(date, fieldName = 'Date') {
    if (!date) {
      throw new Error(`${fieldName} is required`)
    }

    const dateObj = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid ${fieldName.toLowerCase()}`)
    }

    if (dateObj < today) {
      throw new Error(`${fieldName} cannot be in the past`)
    }

    return true
  }

  validateTime(time, fieldName = 'Time') {
    if (!time) {
      throw new Error(`${fieldName} is required`)
    }

    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
      throw new Error(`Invalid ${fieldName.toLowerCase()} format. Use HH:MM format`)
    }

    return true
  }

  // Address Validation
  validateAddress(address) {
    if (!address) {
      throw new Error("Address is required")
    }

    if (typeof address !== 'object') {
      throw new Error("Address must be an object")
    }

    const requiredFields = ['street', 'city', 'state', 'postalCode', 'country']
    const missingFields = requiredFields.filter(field => !address[field])
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required address fields: ${missingFields.join(', ')}`)
    }

    // Validate postal code format (basic validation)
    if (!/^[0-9A-Za-z\s-]+$/.test(address.postalCode)) {
      throw new Error("Invalid postal code format")
    }

    return true
  }

  // Payment Method Validation
  validatePaymentMethod(paymentMethod) {
    if (!paymentMethod) {
      throw new Error("Payment method is required")
    }

    const validTypes = ['credit_card', 'debit_card', 'bank_transfer', 'paypal']
    if (!validTypes.includes(paymentMethod.type)) {
      throw new Error("Invalid payment method type")
    }

    // Additional validation based on payment type
    if (paymentMethod.type === 'credit_card' || paymentMethod.type === 'debit_card') {
      this.validateCreditCard(paymentMethod.card)
    }

    return true
  }

  validateCreditCard(card) {
    if (!card) {
      throw new Error("Card information is required")
    }

    const requiredFields = ['number', 'expiryMonth', 'expiryYear', 'cvv', 'nameOnCard']
    const missingFields = requiredFields.filter(field => !card[field])
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required card fields: ${missingFields.join(', ')}`)
    }

    // Basic card number validation (Luhn algorithm)
    if (!this._luhnCheck(card.number.replace(/\s+/g, ''))) {
      throw new Error("Invalid card number")
    }

    // Validate expiry date
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() + 1
    const currentYear = currentDate.getFullYear() % 100
    
    if (card.expiryYear < currentYear || 
        (card.expiryYear === currentYear && card.expiryMonth < currentMonth)) {
      throw new Error("Card has expired")
    }

    // Validate CVV
    if (!/^\d{3,4}$/.test(card.cvv)) {
      throw new Error("Invalid CVV")
    }

    return true
  }

  // Luhn algorithm for card validation
  _luhnCheck(cardNumber) {
    let sum = 0
    let shouldDouble = false
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i))
      
      if (shouldDouble) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      
      sum += digit
      shouldDouble = !shouldDouble
    }
    
    return (sum % 10) === 0
  }

  // Booking Validations
  validateBooking(booking) {
    if (!booking) {
      throw new Error("Booking information is required")
    }

    const requiredFields = ['userId', 'caregiverId', 'startTime', 'endTime', 'children', 'location']
    const missingFields = requiredFields.filter(field => !booking[field])
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required booking fields: ${missingFields.join(', ')}`)
    }

    // Validate dates
    const startTime = new Date(booking.startTime)
    const endTime = new Date(booking.endTime)
    const now = new Date()

    if (startTime >= endTime) {
      throw new Error("End time must be after start time")
    }

    if (startTime < now) {
      throw new Error("Booking cannot be in the past")
    }

    // Validate children array
    if (!Array.isArray(booking.children) || booking.children.length === 0) {
      throw new Error("At least one child must be selected")
    }

    // Validate location
    this.validateAddress(booking.location)

    return true
  }

  // Review and Rating Validations
  validateReview(review) {
    if (!review) {
      throw new Error("Review information is required")
    }

    const requiredFields = ['bookingId', 'rating', 'comment', 'reviewerId', 'revieweeId']
    const missingFields = requiredFields.filter(field => review[field] === undefined || review[field] === null)
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required review fields: ${missingFields.join(', ')}`)
    }

    // Validate rating
    if (typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
      throw new Error("Rating must be a number between 1 and 5")
    }

    // Validate comment length
    if (typeof review.comment !== 'string' || review.comment.trim().length < 10) {
      throw new Error("Comment must be at least 10 characters long")
    }

    if (review.comment.length > VALIDATION.BIO_MAX_LENGTH) {
      throw new Error(`Comment must be less than ${VALIDATION.BIO_MAX_LENGTH} characters`)
    }

    return true
  }

  // User Profile Validation
  validateUserProfile(profile, isPartial = false) {
    const errors = []

    if (!isPartial || profile.name !== undefined) {
      try {
        this.validateName(profile.name)
      } catch (error) {
        errors.push(error.message)
      }
    }

    if (!isPartial || profile.email !== undefined) {
      try {
        this.validateEmail(profile.email)
      } catch (error) {
        errors.push(error.message)
      }
    }

    if (!isPartial || profile.phone !== undefined) {
      try {
        this.validatePhone(profile.phone)
      } catch (error) {
        errors.push(error.message)
      }
    }

    if (!isPartial || profile.role !== undefined) {
      try {
        this.validateRole(profile.role)
      } catch (error) {
        errors.push(error.message)
      }
    }

    if (profile.bio && profile.bio.length > VALIDATION.BIO_MAX_LENGTH) {
      errors.push(`Bio must be less than ${VALIDATION.BIO_MAX_LENGTH} characters`)
    }

    if (profile.hourlyRate !== undefined) {
      if (profile.hourlyRate < VALIDATION.HOURLY_RATE_MIN || profile.hourlyRate > VALIDATION.HOURLY_RATE_MAX) {
        errors.push(`Hourly rate must be between ₱${VALIDATION.HOURLY_RATE_MIN} and ₱${VALIDATION.HOURLY_RATE_MAX}`)
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "))
    }

    return true
  }

  // Job Validation
  validateJob(job, isPartial = false) {
    const errors = []

    if (!isPartial || job.title !== undefined) {
      if (!job.title || job.title.trim().length < 5) {
        errors.push("Job title must be at least 5 characters long")
      }
    }

    if (!isPartial || job.description !== undefined) {
      if (!job.description || job.description.trim().length < 20) {
        errors.push("Job description must be at least 20 characters long")
      }
    }

    if (!isPartial || job.location !== undefined) {
      if (!job.location || job.location.trim().length < 3) {
        errors.push("Location must be at least 3 characters long")
      }
    }

    if (!isPartial || job.salary !== undefined) {
      if (!job.salary || job.salary < VALIDATION.HOURLY_RATE_MIN || job.salary > VALIDATION.HOURLY_RATE_MAX) {
        errors.push(`Hourly rate must be between ₱${VALIDATION.HOURLY_RATE_MIN} and ₱${VALIDATION.HOURLY_RATE_MAX}`)
      }
    }

    if (job.requirements && job.requirements.length > 1000) {
      errors.push("Requirements must be less than 1000 characters")
    }

    if (job.schedule && job.schedule.length > 200) {
      errors.push("Schedule must be less than 200 characters")
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "))
    }

    return true
  }

  // Application Validation
  validateApplication(application) {
    const errors = []

    if (application.coverLetter && application.coverLetter.length > 1000) {
      errors.push("Cover letter must be less than 1000 characters")
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "))
    }

    return true
  }



  // Job Alert Validation
  validateJobAlert(alert) {
    const errors = []

    if (!alert.title || alert.title.trim().length < 3) {
      errors.push("Alert title must be at least 3 characters long")
    }

    if (alert.keywords && alert.keywords.length > 10) {
      errors.push("Maximum 10 keywords allowed")
    }

    if (alert.maxSalary && alert.minSalary && alert.maxSalary < alert.minSalary) {
      errors.push("Maximum salary must be greater than minimum salary")
    }

    if (errors.length > 0) {
      throw new Error(errors.join(", "))
    }

    return true
  }

  // Sanitization Methods
  sanitizeString(str) {
    if (!str) return ""
    return str.trim().replace(/[<>]/g, "")
  }

  sanitizeEmail(email) {
    if (!email) return ""
    return email.toLowerCase().trim()
  }

  sanitizePhone(phone) {
    if (!phone) return ""
    return phone.replace(/[^\d+\-$$$$\s]/g, "")
  }

  // File Validation
  validateImageFile(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only JPEG, PNG, and WebP images are allowed")
    }

    if (file.size > maxSize) {
      throw new Error("Image size must be less than 5MB")
    }

    return true
  }

  validateDocumentFile(file) {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Only PDF, JPEG, and PNG files are allowed")
    }

    if (file.size > maxSize) {
      throw new Error("File size must be less than 10MB")
    }

    return true
  }
}

export const validator = new Validator()
