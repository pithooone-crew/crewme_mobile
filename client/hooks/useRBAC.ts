import { useAuth } from "@/context/AuthContext";

export type UserRole = "crew_member" | "lead" | "foreman" | "project_manager" | "admin";

const roleHierarchy: UserRole[] = ["crew_member", "lead", "foreman", "project_manager", "admin"];

export function useRBAC() {
  const { user } = useAuth();
  const userRole = (user?.role as UserRole) || "crew_member";
  const userRoleIndex = roleHierarchy.indexOf(userRole);

  const hasMinRole = (minRole: UserRole): boolean => {
    const minRoleIndex = roleHierarchy.indexOf(minRole);
    return userRoleIndex >= minRoleIndex;
  };

  const isAtLeast = {
    crewMember: userRoleIndex >= 0,
    lead: userRoleIndex >= 1,
    foreman: userRoleIndex >= 2,
    projectManager: userRoleIndex >= 3,
    admin: userRoleIndex >= 4,
  };

  const getRoleLabel = (role: UserRole): string => {
    const labels: Record<UserRole, string> = {
      crew_member: "Crew Member",
      lead: "Lead",
      foreman: "Foreman",
      project_manager: "Project Manager",
      admin: "Admin",
    };
    return labels[role] || role;
  };

  return {
    userRole,
    hasMinRole,
    isAtLeast,
    getRoleLabel,
  };
}
