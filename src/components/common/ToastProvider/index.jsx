import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--border-radius)",
          fontSize: "var(--font-size-sm)",
          maxWidth: "400px",
          boxShadow: "var(--shadow-sm)",
        },
        success: {
          iconTheme: {
            primary: "var(--color-success)",
            secondary: "var(--bg-card)",
          },
          style: {
            borderLeftColor: "var(--color-success)",
            borderLeftWidth: "4px",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--color-danger)",
            secondary: "var(--bg-card)",
          },
          style: {
            borderLeftColor: "var(--color-danger)",
            borderLeftWidth: "4px",
          },
        },
        loading: {
          iconTheme: {
            primary: "var(--color-info)",
            secondary: "var(--bg-card)",
          },
          style: {
            borderLeftColor: "var(--color-info)",
            borderLeftWidth: "4px",
          },
        },
      }}
      containerStyle={{
        top: 20,
        right: 20,
      }}
    />
  );
};

export default ToastProvider;