import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import TrucksManagement from "./pages/admin/TrucksManagement";
import EquipmentManagement from "./pages/admin/EquipmentManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import LeadsManagement from "./pages/admin/LeadsManagement";
import AIContentGenerator from "./pages/admin/AIContentGenerator";
import UsersManagement from "./pages/admin/UsersManagement";
import EmailPreview from "./pages/admin/EmailPreview";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="leads" element={<LeadsManagement />} />
            <Route path="trucks" element={<TrucksManagement />} />
            <Route path="equipment" element={<EquipmentManagement />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="ai" element={<AIContentGenerator />} />
            <Route path="users" element={<UsersManagement />} />
            <Route path="email-preview" element={<EmailPreview />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
