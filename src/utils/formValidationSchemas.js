import * as Yup from 'yup';

// Vendor Ad Form Validation Schema
export const vendorAdFormSchema = Yup.object().shape({
  // Basic Information
  title: Yup.string()
    .required('Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  
  description: Yup.string()
    .required('Description is required')
    .test('min-words', 'Description must be at least 100 words', function(value) {
      if (!value) return false;
      const wordCount = value.trim().split(/\s+/).length;
      return wordCount >= 100;
    })
    .max(5000, 'Description must not exceed 5000 characters'),
  
  company_name: Yup.string()
    .required('Company name is required')
    .min(2, 'Company name must be at least 2 characters')
    .max(100, 'Company name must not exceed 100 characters'),
  
  // Category
  category_id: Yup.string()
    .required('Category is required'),
  
  // Location Information
  location: Yup.string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters'),
  
  service_areas: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one service area is required'),
  
  // Contact Information
  contact_number: Yup.string()
    .matches(/^[+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters'),
  
  whatsapp_number: Yup.string()
    .matches(/^[+]?[0-9\s\-\(\)]+$/, 'Invalid WhatsApp number format')
    .min(10, 'WhatsApp number must be at least 10 characters')
    .max(20, 'WhatsApp number must not exceed 20 characters'),
  
  // Pricing Information
  price_amount: Yup.number()
    .min(0, 'Price must be a positive number'),
  
  price_range: Yup.string()
    .max(50, 'Price range must not exceed 50 characters'),
  
  currency: Yup.string()
    .required('Currency is required')
    .oneOf(['USD', 'CAD', 'EUR', 'GBP', 'INR'], 'Invalid currency'),
  
  // Services
  services_offered: Yup.array()
    .of(Yup.string())
    .min(1, 'At least one service must be offered'),
  
  // Experience
  experience_years: Yup.number()
    .min(0, 'Experience years must be non-negative')
    .max(50, 'Experience years seems too high'),
  
  // Portfolio URL
  portfolio_url: Yup.string()
    .url('Invalid URL format'),
});

// Event Ad Form Validation Schema
export const eventAdFormSchema = Yup.object().shape({
  // Service Category
  category_id: Yup.string()
    .required('Service selection is required'),
  
  // Location
  location: Yup.string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters'),
  
  // Event Date
  event_date: Yup.string()
    .required('Event date is required'),
  
  // Duration
  duration: Yup.string()
    .max(50, 'Duration must not exceed 50 characters'),
  
  // Budget
  budget: Yup.string()
    .max(50, 'Budget must not exceed 50 characters'),
  
  // Description
  description: Yup.string()
    .required('Description is required')
    .test('min-words', 'Description must be at least 100 words', function(value) {
      if (!value) return false;
      const wordCount = value.trim().split(/\s+/).length;
      return wordCount >= 100;
    })
    .max(5000, 'Description must not exceed 5000 characters'),
  
  // Tags (Event Type) - optional
  tags: Yup.array()
    .of(Yup.number()),
  
  // Attachments - optional
  attachments: Yup.array(),
});

// Pre-saved Message Form Schema
export const preSavedMessageSchema = Yup.object().shape({
  title: Yup.string()
    .required('Message title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(50, 'Title must not exceed 50 characters'),
  
  message: Yup.string()
    .required('Message content is required')
    .min(10, 'Message must be at least 10 characters')
    .max(500, 'Message must not exceed 500 characters'),
  
  category: Yup.string()
    .required('Category is required')
    .oneOf(['inquiry', 'quote', 'follow_up', 'general'], 'Invalid category'),
});

// Profile Update Form Schema
export const profileUpdateSchema = Yup.object().shape({
  full_name: Yup.string()
    .required('Full name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters'),
  
  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),
  
  phone_number: Yup.string()
    .matches(/^[+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 characters')
    .max(20, 'Phone number must not exceed 20 characters'),
  
  location: Yup.string()
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters'),
  
  bio: Yup.string()
    .max(500, 'Bio must not exceed 500 characters'),
});

// File validation helper
export const validateFiles = (files, maxSize = 10 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) => {
  if (!files || files.length === 0) return [];
  
  const errors = [];
  
  files.forEach((file, index) => {
    if (file.size > maxSize) {
      errors.push(`File ${index + 1}: Size too large (max ${maxSize / 1024 / 1024}MB)`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File ${index + 1}: Invalid file type`);
    }
  });
  
  return errors;
};

// Form field configurations for dynamic rendering
export const vendorFormFields = [
  {
    section: 'Basic Information',
    fields: [
      { name: 'title', label: 'Service Title', type: 'text', required: true, placeholder: 'e.g. Professional Wedding Photography' },
      { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe your services in detail...' },
      { name: 'company_name', label: 'Company Name', type: 'text', required: true, placeholder: 'Your business name' },
      { name: 'category_id', label: 'Category', type: 'select', required: true, options: [] }, // Options loaded dynamically
    ]
  },
  {
    section: 'Location & Services',
    fields: [
      { name: 'location', label: 'Primary Location', type: 'text', required: true, placeholder: 'City, State/Province' },
      { name: 'service_areas', label: 'Service Areas', type: 'multiselect', required: true, placeholder: 'Select areas you serve' },
      { name: 'services_offered', label: 'Services Offered', type: 'tags', required: true, placeholder: 'Add services you offer' },
    ]
  },
  {
    section: 'Contact Information',
    fields: [
      { name: 'contact_number', label: 'Phone Number', type: 'phone', required: false, placeholder: '+1 (555) 123-4567' },
      { name: 'whatsapp_number', label: 'WhatsApp Number', type: 'phone', required: false, placeholder: '+1 (555) 123-4567' },
    ]
  },
  {
    section: 'Pricing & Experience',
    fields: [
      { name: 'price_range', label: 'Price Range', type: 'text', required: false, placeholder: 'e.g. $500 - $2000' },
      { name: 'currency', label: 'Currency', type: 'select', required: true, options: [
        { label: 'USD - US Dollar', value: 'USD' },
        { label: 'CAD - Canadian Dollar', value: 'CAD' },
        { label: 'EUR - Euro', value: 'EUR' },
        { label: 'GBP - British Pound', value: 'GBP' },
        { label: 'INR - Indian Rupee', value: 'INR' },
      ]},
      { name: 'experience_years', label: 'Years of Experience', type: 'number', required: false, placeholder: '5' },
    ]
  },
  {
    section: 'Portfolio & Media',
    fields: [
      { name: 'portfolio_url', label: 'Portfolio Website', type: 'url', required: false, placeholder: 'https://yourportfolio.com' },
      { name: 'attachments', label: 'Upload Images/Documents', type: 'file', required: false, multiple: true, accept: 'image/*,.pdf' },
    ]
  }
];

export const eventFormFields = [
  {
    section: 'Event Details',
    fields: [
      { name: 'title', label: 'Event Title', type: 'text', required: true, placeholder: 'e.g. Sarah & John Wedding' },
      { name: 'description', label: 'Event Description', type: 'textarea', required: true, placeholder: 'Describe your event in detail...' },
      { name: 'event_type', label: 'Event Type', type: 'select', required: true, options: [
        { label: 'Wedding', value: 'wedding' },
        { label: 'Birthday Party', value: 'birthday' },
        { label: 'Corporate Event', value: 'corporate' },
        { label: 'Anniversary', value: 'anniversary' },
        { label: 'Baby Shower', value: 'baby_shower' },
        { label: 'Graduation', value: 'graduation' },
        { label: 'Other', value: 'other' },
      ]},
    ]
  },
  {
    section: 'Date & Location',
    fields: [
      { name: 'event_date', label: 'Event Date', type: 'date', required: true },
      { name: 'event_time', label: 'Event Time', type: 'time', required: true },
      { name: 'venue_name', label: 'Venue Name', type: 'text', required: true, placeholder: 'Grand Ballroom Hotel' },
      { name: 'venue_address', label: 'Venue Address', type: 'text', required: true, placeholder: '123 Main St, City' },
      { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'Toronto' },
    ]
  },
  {
    section: 'Budget & Requirements',
    fields: [
      { name: 'guest_count', label: 'Expected Guests', type: 'number', required: true, placeholder: '100' },
      { name: 'budget_min', label: 'Minimum Budget', type: 'number', required: false, placeholder: '5000' },
      { name: 'budget_max', label: 'Maximum Budget', type: 'number', required: false, placeholder: '10000' },
      { name: 'services_required', label: 'Services Required', type: 'multiselect', required: true, options: [
        { label: 'Photography', value: 'photography' },
        { label: 'Videography', value: 'videography' },
        { label: 'Catering', value: 'catering' },
        { label: 'DJ/Music', value: 'dj' },
        { label: 'Decoration', value: 'decoration' },
        { label: 'Flowers', value: 'flowers' },
        { label: 'Transportation', value: 'transportation' },
        { label: 'Event Planning', value: 'event_planning' },
      ]},
    ]
  },
  {
    section: 'Contact Information',
    fields: [
      { name: 'contact_name', label: 'Your Name', type: 'text', required: true, placeholder: 'John Doe' },
      { name: 'contact_phone', label: 'Phone Number', type: 'phone', required: true, placeholder: '+1 (555) 123-4567' },
      { name: 'contact_email', label: 'Email Address', type: 'email', required: true, placeholder: 'john@example.com' },
      { name: 'special_requirements', label: 'Special Requirements', type: 'textarea', required: false, placeholder: 'Any special requests or requirements...' },
    ]
  }
];