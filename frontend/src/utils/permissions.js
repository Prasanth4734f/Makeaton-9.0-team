// ─── Role-Based Permissions ────────────────────────────────────────────────────

export const PERMISSIONS = {
  admin: {
    products: { view: true,  create: true,  edit: true,  delete: true  },
    plans:    { view: true,  create: true,  edit: true,  delete: true  },
    quotations:    { view: true,  create: true,  edit: true,  delete: true  },
    subscriptions: { view: true,  create: true,  edit: true,  delete: true  },
    invoices:      { view: true,  create: true,  edit: true,  delete: true  },
    payments:      { view: true,  create: true,  edit: true,  delete: true  },
    actionCenter:  { view: true,  resolve: true  },
    customers:     { view: true,  create: true,  edit: true,  delete: true  },
    reports:       { view: true  },
    settings:      { view: true,  edit: true  },
    users:         { view: true,  create: true,  edit: true,  delete: true  },
  },
  staff: {
    products:      { view: true,  create: false, edit: false, delete: false },
    plans:         { view: true,  create: false, edit: false, delete: false },
    quotations:    { view: true,  create: true,  edit: true,  delete: false },
    subscriptions: { view: true,  create: true,  edit: true,  delete: false },
    invoices:      { view: true,  create: true,  edit: false, delete: false },
    payments:      { view: true,  create: true,  edit: false, delete: false },
    actionCenter:  { view: true,  resolve: true  },
    customers:     { view: true,  create: true,  edit: true,  delete: false },
    reports:       { view: true  },
    settings:      { view: false, edit: false  },
    users:         { view: false, create: false, edit: false, delete: false },
  },
  customer: {
    products:      { view: true,  create: false, edit: false, delete: false },
    plans:         { view: true,  create: false, edit: false, delete: false },
    quotations:    { view: true,  create: false, edit: false, delete: false },
    subscriptions: { view: true,  create: false, edit: false, delete: false },
    invoices:      { view: true,  create: false, edit: false, delete: false },
    payments:      { view: true,  create: false, edit: false, delete: false },
    actionCenter:  { view: false, resolve: false },
    customers:     { view: false, create: false, edit: false, delete: false },
    reports:       { view: false },
    settings:      { view: false, edit: false  },
    users:         { view: false, create: false, edit: false, delete: false },
  },
};

/**
 * Check if a role has a specific permission.
 * @param {string} role - 'admin' | 'staff' | 'customer'
 * @param {string} resource - e.g., 'products'
 * @param {string} action - e.g., 'create'
 */
export function hasPermission(role, resource, action) {
  return PERMISSIONS[role]?.[resource]?.[action] === true;
}

/**
 * Get allowed navigation items for a role.
 */
export function getAllowedNavItems(role) {
  if (role === 'customer') return ['dashboard', 'customerPortal', 'profile'];
  return ['dashboard', 'products', 'plans', 'quotations', 'subscriptions', 'invoices', 'payments', 'actionCenter', 'profile'];
}
