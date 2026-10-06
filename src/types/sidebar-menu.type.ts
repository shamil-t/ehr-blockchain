export interface SidebarMenuItem {
  name: string;
  menuItems: MenuItem[];
}

interface MenuItem {
  label: string;
  icon: string;
  routerLink: string;
  active: boolean;
}
