import {Component, inject, input, model, ModelSignal, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink} from "@angular/router";
import {SidebarMenuItem} from "../../../types/sidebar-menu.type";


@Component({
  selector: 'app-sidebar',
  imports: [
    RouterLink
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.sass',
})
export class SidebarComponent implements OnInit {
  title = input('')
  sidebarNavLinks: ModelSignal<SidebarMenuItem[] | undefined> = model()
  router = inject(Router)
  protected isCollapsed: boolean = false;

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const currentUrl = event.url
        let navs = this.sidebarNavLinks() as SidebarMenuItem[];

        this.sidebarNavLinks.update((items: SidebarMenuItem[] | undefined) =>
          items?.map(item => ({
            ...item,
            menuItems: item.menuItems.map(menu => ({
              ...menu,
              active: menu.routerLink === currentUrl
            })),
          }))
        )
      }
    })
  }

  protected toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
