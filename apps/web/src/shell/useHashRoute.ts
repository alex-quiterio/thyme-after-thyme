import { useEffect, useState } from "react";

const read = () => window.location.hash.replace(/^#\/?/, "");

export function useHashRoute(): [string, (id: string) => void] {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => setRoute(read());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return [route, (id) => void (window.location.hash = `/${id}`)];
}
