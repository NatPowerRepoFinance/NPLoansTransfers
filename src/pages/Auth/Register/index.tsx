import { useAuth } from "@/lib/authProvider";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface RegisterForm {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password?: string;
}

const Register = () => {
    const { setToken } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<RegisterForm>({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        confirm_password: "",
    });

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { confirm_password, ...payload } = formData;
        if (formData.password !== confirm_password) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }
        
        try {
        const res = await fetch("https://as-natpower-purchase-order-backend-uksouth.azurewebsites.net/auth/register", {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data?.message || "Registration failed");
        }

        if (data.token) {
            setToken(data.token);
            navigate("/");
        } else {
            navigate("/auth");
        }
        } catch (err: any) {
        setError(err.message || "An error occurred");
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center">
            <div className="relative z-10">
                <div className="flex items-center justify-center">
                    <div className="p-8 bg-white text-black">
                        <div className="flex flex-col items-center justify-center gap-3 space-y-4">
                            <h2>Register</h2>
                            <form onSubmit={handleSubmit}>
                                <div>
                                    <div
                                        className="group relative rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                                        <input type="text" name="first_name" placeholder="First Name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            required
                                            className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div
                                        className="group relative rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                                        <input type="text" name="last_name" placeholder="Last Name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            required
                                            className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div
                                        className="group relative rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                                        <input type="email" name="email" placeholder="Email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            autoComplete="off"
                                            required
                                            className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground" />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div
                                        className="group relative rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                                        <div className="flex items-center">
                                            <input type="password" name="password" id="password" placeholder="Password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            required
                                                className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <div className="group relative rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                                        <div className="flex items-center">
                                        <input
                                            type="password"
                                            name="confirm_password"
                                            id="confirm_password"
                                            placeholder="Confirm Password"
                                            value={formData.confirm_password}
                                            onChange={handleChange}
                                            required
                                            className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"
                                        />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-x-2">
                                    <button
                                        className="font-semibold w-full hover:bg-white hover:text-black hover:ring hover:ring-neutral-700 transition duration-300 inline-flex items-center justify-center rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50  bg-[#1d2636] text-white h-10 px-4 py-2"
                                        type="submit" disabled={loading} >{loading ? "Registering..." : "Register"}</button>
                                </div>
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-gray-600">
                                        Already have an account?{" "}
                                        <a href="/auth" className="text-[#1d2636] font-medium hover:underline">
                                        Login
                                        </a>
                                    </p>
                                </div>
                                {error && <div className="text-red-500 text-sm mt-4 text-center">{error}</div>}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
