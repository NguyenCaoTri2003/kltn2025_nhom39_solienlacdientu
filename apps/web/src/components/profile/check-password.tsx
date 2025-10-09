"use client"

import { CheckCircle, XCircle } from "lucide-react"
import { isValidPassword } from "@packages/utils/Regex"

interface PasswordStrengthCheckerProps {
  password: string
}

const rules = [
  { label: "Có từ 8 đến 50 ký tự", test: (pw: string) => pw.length >= 8 && pw.length <= 50 },
  { label: "Có chữ hoa (A-Z)", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "Có chữ thường (a-z)", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "Có số (0-9)", test: (pw: string) => /[0-9]/.test(pw) },
  { label: "Có ký tự đặc biệt (!@#$...)", test: (pw: string) => /[^A-Za-z0-9]/.test(pw) },
  { label: "Không chứa khoảng trắng", test: (pw: string) => !/\s/.test(pw) },
]

export function PasswordStrengthChecker({ password }: PasswordStrengthCheckerProps) {
  return (
    <div className="space-y-1 mt-2 text-sm">
      {rules.map((rule, index) => {
        const passed = rule.test(password)
        return (
          <div key={index} className="flex items-center gap-2">
            {passed ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-400" />
            )}
            <span className={passed ? "text-green-600" : "text-gray-500"}>
              {rule.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}


export const isPasswordStrong = (password: string) => {
  return isValidPassword(password)
};