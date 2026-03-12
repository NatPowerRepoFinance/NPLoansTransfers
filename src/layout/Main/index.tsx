import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";


export default function MainLayout() {
	return (
		<div className="w-full min-h-screen">
			<Navbar />
			<Outlet />
		</div>
	);
}
