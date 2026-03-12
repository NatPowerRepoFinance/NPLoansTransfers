import { useMemo } from "react";
import SignIn from "./SignIn";

export default function Auth() {
  const signInComponent = useMemo(() => <SignIn />, []);

  return (
    <div className="flex flex-col justify-center items-center">
      <div className="relative z-10">
        {signInComponent}
      </div>
    </div>
  );
}
