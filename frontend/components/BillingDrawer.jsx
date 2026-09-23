import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Crown } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { verifyPayment } from "../features/verifyPayment.js";
import { createOrder } from "../features/createOrder.js";
import { setUserData } from "../src/redux/userSlice.js";
import getCurrentUser from "../features/getCurrentUser.js";

function BillingDrawer({ open, onClose }) {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const handleUpgrade = async (planId) => {
    try {
      const data = await createOrder(planId);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data?.order?.amount,
        currency: data?.order?.currency,
        name: "KaidoAI",
        description: `${data?.plan?.name} Plan`,
        order_id: data?.order?.id,

        handler: async (response) => {
          try {
            const data = await verifyPayment(response);
            console.log(data);

            const updatedUser = await getCurrentUser();
            dispatch(setUserData(updatedUser));

            onClose();
          } catch (error) {
            console.log(error);
          }
        },

        theme: {
          color: "#4F46E5",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.log(`Upgrade failed ${error}`);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25 }}
            className="fixed right-0 top-0 z-50 flex h-[100dvh] w-[min(90vw,380px)] flex-col border-l border-white/10 bg-[#0f1117] shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4 sm:p-5">
              <div>
                <div className="text-lg font-semibold text-white">Billing</div>

                <div className="text-sm text-slate-400">Plans & Credits</div>
              </div>

              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 transition-colors hover:bg-white/10"
              >
                <X size={18} className="text-slate-300" />
              </button>
            </div>

            <div className="shrink-0 p-4 sm:p-5">
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Current Plan</p>

                    <h3 className="text-xl font-bold text-white">
                      {userData?.plan || "free"}
                    </h3>
                  </div>

                  <Crown className="text-yellow-400" />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs text-slate-400">
                    <span>Credits</span>

                    <span>
                      {userData?.credits || 0}/{userData?.totalCredits || 100}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{
                        width: `${
                          ((userData?.credits || 0) /
                            (userData?.totalCredits || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5 sm:px-5">
              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="font-semibold text-white">Starter Plan</h3>

                <p className="mt-2 text-2xl font-bold text-indigo-400">₹199</p>

                <p className="mt-1 text-sm text-slate-400">500 Credits</p>

                <button
                  onClick={() => handleUpgrade("starter")}
                  className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-white transition-colors hover:bg-indigo-700"
                >
                  Upgrade
                </button>
              </div>

              <div className="rounded-xl border border-white/10 p-4">
                <h3 className="font-semibold text-white">Pro Plan</h3>

                <p className="mt-2 text-2xl font-bold text-indigo-400">₹499</p>

                <p className="mt-1 text-sm text-slate-400">1000 Credits</p>

                <button
                  onClick={() => handleUpgrade("pro")}
                  className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-white transition-colors hover:bg-indigo-700"
                >
                  Upgrade
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BillingDrawer;
