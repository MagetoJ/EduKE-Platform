/**
 * Permission-based Access Control (RBAC) System
 *
 * This module defines permissions and role-permission mappings for the application.
 */

export enum Permission {
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_REPORTS = 'view_reports',
  MANAGE_POS = 'manage_pos',
  VIEW_SALES_HISTORY = 'view_sales_history',
  MANAGE_INVENTORY = 'manage_inventory',
  MANAGE_USERS = 'manage_users',
  MANAGE_SETTINGS = 'manage_settings',
  MANAGE_BRANCHES = 'manage_branches',
  VIEW_PRINTER_SETTINGS = 'view_printer_settings',

  // School Management Permissions
  MANAGE_TIMETABLE = 'manage_timetable',
  ENTER_GRADES = 'enter_grades',
  VIEW_STUDENT_PROFILES = 'view_student_profiles',
  MANAGE_CURRICULUM = 'manage_curriculum',
}

/**
 * Role Types:
 * - parent_org_admin: School administrator with full access
 * - branch_admin: Campus manager with campus-scoped access
 * - staff: Teacher or office staff (Fee collection and academic records only)
 * - superadmin: Platform-wide admin with full access to everything
 */
export type RoleType = 'parent_org_admin' | 'branch_admin' | 'staff' | 'superadmin';

/**
 * Role-Permission Mapping
 *
 * Defines which permissions each role has access to.
 * This should match the backend ROLE_PERMISSIONS mapping in auth.py
 */
const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  superadmin: Object.values(Permission), // Full access
  parent_org_admin: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_POS,
    Permission.VIEW_SALES_HISTORY,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_USERS,
    Permission.MANAGE_SETTINGS,
    Permission.MANAGE_BRANCHES,
    Permission.MANAGE_TIMETABLE,
    Permission.ENTER_GRADES,
    Permission.VIEW_STUDENT_PROFILES,
    Permission.MANAGE_CURRICULUM,
  ],
  branch_admin: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_POS,
    Permission.VIEW_SALES_HISTORY,
    Permission.MANAGE_INVENTORY,
    Permission.MANAGE_USERS,
    Permission.MANAGE_TIMETABLE,
    Permission.ENTER_GRADES,
    Permission.VIEW_STUDENT_PROFILES,
  ],
  staff: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_SALES_HISTORY,
    Permission.VIEW_PRINTER_SETTINGS,
    Permission.MANAGE_TIMETABLE,
    Permission.ENTER_GRADES,
    Permission.VIEW_STUDENT_PROFILES,
  ],
};

/**
 * Check if a role type has a specific permission
 *
 * @param roleType - The user's role type
 * @param permission - The permission to check
 * @returns true if the role has the permission, false otherwise
 */
export function hasPermission(
  roleType: RoleType | undefined,
  permission: Permission
): boolean {
  if (!roleType) return false;
  return ROLE_PERMISSIONS[roleType]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role type
 *
 * @param roleType - The user's role type
 * @returns Array of permissions for the role
 */
export function getRolePermissions(roleType: RoleType | undefined): Permission[] {
  if (!roleType) return [];
  return ROLE_PERMISSIONS[roleType] ?? [];
}

/**
 * Check if a role is an owner (tenant-wide access)
 *
 * @param roleType - The user's role type
 * @returns true if the role is owner
 */
export function isOwner(roleType: RoleType | undefined): boolean {
  return roleType === 'parent_org_admin';
}

/**
 * Check if a role is branch-scoped (branch admin or staff)
 *
 * @param roleType - The user's role type
 * @returns true if the role is branch-scoped
 */
export function isBranchScoped(roleType: RoleType | undefined): boolean {
  return roleType === 'branch_admin' || roleType === 'staff';
}
