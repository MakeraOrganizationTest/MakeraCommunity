"use client";

import { AuthProvider as AuthProviderComponent } from "@/hooks/use-auth";

//the  userProvider has the child(props) that wrapped with userContext provider
// make sure to use this user provider inside the supabase provider
interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({
  children
}) => {
  return ( 
    <AuthProviderComponent>
      {children}
    </AuthProviderComponent>
   );
}
 
export default AuthProvider;