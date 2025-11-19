import { Home, Shirt, Calendar, ShoppingBag, User, Users } from "lucide-react";
import { BottomNavLink } from "./BottomNavLink";

const Navigation = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <BottomNavLink to="/dashboard" icon={<Home />} label="Home" />
          <BottomNavLink to="/closet" icon={<Shirt />} label="Closet" />
          <BottomNavLink to="/calendar" icon={<Calendar />} label="Calendar" />
          <BottomNavLink to="/friends" icon={<Users />} label="Friends" />
          <BottomNavLink to="/shop" icon={<ShoppingBag />} label="Shop" />
          <BottomNavLink to="/profile" icon={<User />} label="Profile" />
        </div>
      </div>
    </nav>
  );
};

export default Navigation;