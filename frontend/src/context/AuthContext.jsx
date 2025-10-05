// context/ActorContext.jsx
import { createContext, useState } from "react";

export const ActorContext = createContext();

export function ActorProvider({ children }) {
  const [actor, setActor] = useState(localStorage.getItem("actor") || "guest");

  const setDisplayName = (name) => {
    setActor(name);
    localStorage.setItem("actor", name);
  };

  return (
    <ActorContext.Provider value={{ actor, setDisplayName }}>
      {children}
    </ActorContext.Provider>
  );
}



// import { createContext, useState, useEffect } from "react";

// export const AuthContext = createContext();

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);

//   useEffect(() => {
//     // load from localStorage on refresh
//     const storedUser = localStorage.getItem("user");
//     if (storedUser) {
//       setUser(JSON.parse(storedUser));
//     }
//   }, []);

//   const login = (data) => {
//     setUser(data);
//     localStorage.setItem("user", JSON.stringify(data));
//     localStorage.setItem("token", data.token);
//   };

//   const logout = () => {
//     setUser(null);
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//   };

//   return (
//     <AuthContext.Provider value={{ user, login, logout }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }
