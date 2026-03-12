import { useState } from "react";

interface ForgotPasswordFormData {
    email: string;
    new_password: string;
    new_password_confirm: string;
};

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<ForgotPasswordFormData>({
        email: "",
        new_password: "",
        new_password_confirm: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev: ForgotPasswordFormData) => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccess(null);
        setError(null);
        setLoading(false);
    };
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [passwordStrengthMsg, setPasswordStrengthMsg] = useState("");

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);
        setError(null);
        if (!formData.email) return;
    
        if (formData.new_password !== formData.new_password_confirm) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }
    
        try {
            const response = await fetch(
                "https://as-natpower-purchase-order-backend-uksouth.azurewebsites.net/auth/reset",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );
        
            const data = await response.json();

            if (!response.ok) {
                setError(data?.message || "Registration failed");
                throw new Error(data?.message || "Registration failed");
            }
        
            setSuccess(`Password reset successful!`);
            setFormData({
                email: "",
                new_password: "",
                new_password_confirm: "",
            });
        } catch (err : any) {
            setError(err.message || "Unable to reset password.");
        }finally {
            setLoading(false);
        }
    };

    const isStrongPassword = (password: string): boolean => {
        const strongPasswordRegex =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        return strongPasswordRegex.test(password);
      };

	return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="p-8 bg-white text-black">
                <div className="flex flex-col items-center justify-center gap-3 space-y-4">
                <h2>Forgot Password</h2>
                <form className="flex flex-col justify-center" onSubmit={handleForgotPassword}>
                    <div className="group relative w-56 rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                        <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="off"
                        required
                        className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground"
                        />
                    </div>
                    <div
                        className="group relative w-56 mt-4 rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                        <div className="flex items-center">
                            <input type="password" name="new_password" id="new_password" placeholder="New Password"
                                value={formData.new_password}
                                required
                                onChange={(e) => {
                                    const value = e.target.value;
                                    handleChange(e);
                                    if (!value) {
                                            setPasswordStrengthMsg("");
                                        } else if (isStrongPassword(value)) {
                                            setPasswordStrengthMsg("✅ Strong password");
                                        } else {
                                            setPasswordStrengthMsg(
                                            "❌ Weak password: min 8 chars, upper, lower, number, special"
                                            );
                                        }
                                    }}
                                className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground" />
                        </div>
                    </div>
                    {formData.new_password && passwordStrengthMsg && (
                    <small
                        className={`text-sm max-w-56 break-words ${
                        passwordStrengthMsg.includes("Strong")
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                    >
                        {passwordStrengthMsg}
                    </small>
                    )}
                    <div className="group relative w-56 mt-4 rounded-lg border border-neutral-300 focus-within:border-neutral-400 px-3 py-1 duration-200 focus-within:ring focus-within:ring-neutral-500/30">
                        <div className="flex items-center">
                            <input
                                type="password"
                                name="new_password_confirm"
                                id="new_password_confirm"
                                placeholder="Confirm Password"
                                value={formData.new_password_confirm}
                                onChange={handleChange}
                                required
                                className="block w-full border-0 bg-transparent p-0 text-sm file:my-1 placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 focus:ring-teal-500 sm:leading-7 text-foreground"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-x-2">
                    <button
                        className="font-semibold w-full hover:bg-white hover:text-black hover:ring hover:ring-neutral-700 transition duration-300 inline-flex items-center justify-center rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#1d2636] text-white h-10 px-4 py-2"
                        type="submit"
                        disabled={loading ||
                            !isStrongPassword(formData.new_password)
                        }
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                    </div>

                    <div className="mt-6 text-center">
                    <a href="/auth/login" className="text-sm text-[#1d2636] hover:underline font-medium">
                        Back to Login
                    </a>
                    </div>

                </form>
                {error && <div className="text-red-500 text-sm text-center">{error}</div>}
                {success && <div className="text-green-500 text-sm text-center">{success}</div>}
                </div>
            </div>
        </div>
	);
};

export default ForgotPassword;
