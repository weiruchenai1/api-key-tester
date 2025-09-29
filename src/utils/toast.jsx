import React from "react";
import toast from "react-hot-toast";

// 基础提示函数
export const showToast = {
  success: (message) => {
    toast.success(message);
  },
  
  error: (message) => {
    toast.error(message);
  },
  
  info: (message) => {
    toast(message, {
      icon: "ℹ️",
      style: {
        background: "var(--bg-card)",
        color: "var(--text-primary)",
        border: "1px solid var(--border-color)",
        borderLeftColor: "var(--color-info)",
        borderLeftWidth: "4px",
      },
    });
  },
  
  warning: (message) => {
    toast(message, {
      icon: "⚠️",
      style: {
        background: "var(--bg-card)",
        color: "var(--text-primary)", 
        border: "1px solid var(--border-color)",
        borderLeftColor: "var(--color-warning)",
        borderLeftWidth: "4px",
      },
      iconTheme: {
        primary: "var(--color-warning)",
        secondary: "var(--bg-card)",
      },
    });
  },
  
  loading: (message) => {
    return toast.loading(message);
  },
  
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};

// 确认对话框函数
export const showConfirm = (message, options = {}) => {
  return new Promise((resolve) => {
    const {
      confirmText = "确定",
      cancelText = "取消",
      confirmStyle = "danger", // "danger" | "primary"
    } = options;

    toast(
      (t) => (
        <div style={{ minWidth: "250px" }}>
          <div style={{ 
            marginBottom: "12px", 
            fontSize: "var(--font-size-sm)",
            color: "var(--text-primary)",
          }}>
            {message}
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button
              style={{
                padding: "6px 12px",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
                transition: "var(--transition-fast)",
              }}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = "var(--bg-tertiary)";
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = "var(--bg-input)";
              }}
            >
              {cancelText}
            </button>
            <button
              style={{
                padding: "6px 12px",
                backgroundColor: confirmStyle === "danger" ? "var(--color-danger)" : "var(--color-primary)",
                color: "white",
                border: "none",
                borderRadius: "var(--border-radius)",
                cursor: "pointer",
                fontSize: "var(--font-size-xs)",
                transition: "var(--transition-fast)",
              }}
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        style: {
          background: "var(--bg-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--border-radius)",
          padding: "16px",
          boxShadow: "var(--shadow-sm)",
        },
      }
    );
  });
};

// 替换 alert 的函数
export const alert = (message) => {
  showToast.info(message);
};

// 替换 confirm 的函数  
export const confirm = (message) => {
  return showConfirm(message);
};