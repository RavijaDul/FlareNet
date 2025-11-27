// context/ActorContext.jsx
import { createContext, useState } from "react";

export const ActorContext = createContext();

export function ActorProvider({ children }) {
  // persist name and role separately so other parts can consume them
  const [name, setName] = useState(localStorage.getItem("actorName") || "Engineer");
  const [role, setRole] = useState(localStorage.getItem("actorRole") || "engineer");

  const setDisplayName = (newName) => {
    const val = newName && newName.trim() ? newName : (role === "engineer" ? "Engineer" : "Inspector");
    setName(val);
    localStorage.setItem("actorName", val);
  };

  const setActorRole = (newRole) => {
    const val = newRole === "inspector" ? "inspector" : "engineer";
    setRole(val);
    localStorage.setItem("actorRole", val);
    // if user hasn't customized name, update default display name to match role
    const curName = localStorage.getItem("actorName") || "";
    if (!curName || curName.toLowerCase().startsWith("engineer") || curName.toLowerCase().startsWith("inspector")) {
      const defaultName = val === "engineer" ? "Engineer" : "Inspector";
      setName(defaultName);
      localStorage.setItem("actorName", defaultName);
    }
  };

  return (
    <ActorContext.Provider value={{ name, role, setDisplayName, setRole: setActorRole }}>
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
