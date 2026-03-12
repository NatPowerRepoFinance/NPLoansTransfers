import { Menu, Transition } from "@headlessui/react";
// import { BellIcon } from "@heroicons/react/16/solid";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/authProvider";
import { getUserInitials, getUserFullName } from "@/lib/utils";
import Cookies from "js-cookie";

export default function UserSection() {
	const { setToken, setRefreshToken } = useAuth();

	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			// await fetch("https://as-natpower-purchase-order-backend-uksouth.azurewebsites.net/auth/sign-out", {
			// method: "POST",
			// headers: {
			// 	"Content-Type": "application/json",
			// 	"X-Access-Token": token || "",
			// 	},
			// });
			setToken(null);
			setRefreshToken(null);
			localStorage.removeItem("poLoginTime");
			Cookies.remove("role");
			navigate("/auth", { replace: true });
		} catch (error) {
			console.error("Logout failed:", error);
			navigate("/", { replace: true });
		}
	};

	return (
		<div className="flex items-center">
			{/* <div className="relative">
				<ConditionalNavLink />
			</div> */}
			{/* <div className="relative">
				<BellIcon
					width={20}
					className="transition-all duration-300 ease-in-out cursor-pointer hover:scale-110 hover:animate-[wiggle_0.3s_ease-in-out_infinite]"
				/>
			</div> */}
			<div className="ml-4 flex items-center space-x-1">
				<div className="w-8 h-8 text-lg rounded-full bg-white cursor-default text-black flex justify-center items-center p-1" title={getUserFullName()}>
					<span className="flex flex-col items-center justify-center">
						{getUserInitials()}
					</span>
				</div>
				<Menu as="div" className="relative inline-block text-left">
					<div>
						<Menu.Button className="inline-flex w-full justify-center rounded-md bg-transparent bg-opacity-20 px-2 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75" aria-label="User menu">
							<ChevronDownIcon width={18} aria-hidden="true" />
						</Menu.Button>
					</div>
					<Transition
						as={Fragment}
						enter="transition ease-out duration-100"
						enterFrom="transform opacity-0 scale-95"
						enterTo="transform opacity-100 scale-100"
						leave="transition ease-in duration-75"
						leaveFrom="transform opacity-100 scale-100"
						leaveTo="transform opacity-0 scale-95"
					>
						<Menu.Items className="absolute z-[3000] right-0 mt-2 w-32 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg focus:outline-none">
							<div className="px-1 py-1 ">
								<Menu.Item>
									{({ active }: { active: boolean }) => (
										<div
											className={`${
												active ? "bg-white text-black cursor-pointer" : "text-gray-800"
											} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
											onClick={handleLogout}
										>
											Logout
										</div>
									)}
								</Menu.Item>
							</div>
						</Menu.Items>
					</Transition>
				</Menu>
			</div>
		</div>
	);
}
