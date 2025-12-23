import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderTree,
  Receipt,
  FileText,
  UserCheck,
  MessageSquare,
  Image,
  Megaphone,
  LayoutTemplate,
  Menu,
  BookOpen,
  Palette,
  Bell,
  Ticket,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Share2,
  Crown,
  LogOut
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: ShoppingBag },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "orders", label: "Orders", icon: Receipt },
  { id: "customers", label: "Customers", icon: UserCheck },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "subscribers", label: "Subscribers", icon: MessageSquare },
  { id: "requests", label: "Requests", icon: MessageSquare },
];

const contentNavItems: NavItem[] = [
  { id: "media", label: "Media", icon: Image },
  { id: "announcements", label: "Top Bar", icon: Megaphone },
  { id: "homepage", label: "Homepage", icon: LayoutTemplate },
  { id: "megamenu", label: "Menu", icon: Menu },
  { id: "pages", label: "Pages", icon: BookOpen },
  { id: "content", label: "Branding", icon: Palette },
  { id: "footer", label: "Footer", icon: Menu },
  { id: "popups", label: "Popups", icon: Bell },
  { id: "coupons", label: "Coupons", icon: Ticket },
];

const settingsNavItems: NavItem[] = [
  { id: "vip", label: "VIP Program", icon: Crown },
  { id: "social", label: "Social", icon: Share2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export const AdminSidebar = ({ activeTab, onTabChange }: AdminSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-4 lg:mb-6">
      {!isCollapsed && (
        <h3 className="px-3 mb-2 text-[10px] lg:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-0.5 lg:space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onTabChange(item.id);
              setMobileOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary active:scale-[0.98]",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <item.icon className={cn("w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0", isCollapsed && "w-5 h-5 lg:w-6 lg:h-6")} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-[10px] lg:text-xs">
                    {item.badge}
                  </Badge>
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 lg:gap-3 p-3 lg:p-4 border-b border-border/50",
        isCollapsed && "justify-center"
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg lg:rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
              <LayoutDashboard className="w-4 h-4 lg:w-5 lg:h-5 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-sm lg:text-base text-foreground truncate">Admin Panel</h2>
              <p className="text-[10px] lg:text-xs text-muted-foreground truncate">Green Grass Store</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex hover:bg-primary/10 h-8 w-8"
        >
          {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 lg:px-3 py-3 lg:py-4">
        <NavSection title="Main" items={mainNavItems} />
        <NavSection title="Content" items={contentNavItems} />
        <NavSection title="System" items={settingsNavItems} />
        
        {/* Logout Button */}
        <div className="mt-4 px-1">
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200",
              "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
              isCollapsed && "justify-center px-2"
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className={cn("w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0", isCollapsed && "w-5 h-5 lg:w-6 lg:h-6")} />
            {!isCollapsed && <span className="flex-1 text-left">Logout</span>}
          </button>
        </div>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 lg:p-4 border-t border-border/50">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg lg:rounded-xl p-3 lg:p-4">
            <p className="text-[10px] lg:text-xs text-muted-foreground mb-1 lg:mb-2">Need help?</p>
            <p className="text-xs lg:text-sm font-medium text-foreground">Contact Support</p>
            <p className="text-[10px] lg:text-xs text-muted-foreground truncate">support@websearchbd.com</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Trigger - Fixed position with better styling */}
      <div className="lg:hidden fixed bottom-20 left-4 z-40">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 sm:w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col bg-card border-r border-border/50 transition-all duration-300",
        isCollapsed ? "w-16 lg:w-20" : "w-56 lg:w-72"
      )}>
        <SidebarContent />
      </aside>
    </>
  );
};
