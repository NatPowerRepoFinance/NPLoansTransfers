import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <>
      <div className="grid md:grid-cols-2 w-screen h-screen bg-[#1d2636]">
        <div className="flex flex-col items-center justify-center s-md:h-28 bg-[#1d2636]">
          <img
            src="/NatPower_Payoff_Bianco2.png"
            alt="NatPowerLogo"
            className="w-64 sm:w-96"
          />
          <p className="text-white text-3xl font-bold mt-4">Loans and Transfers</p>
        </div>
       
       
        <div className=" flex justify-center items-center bg-white">
          <Outlet />
        </div>
      </div>
    </>
  );
}
