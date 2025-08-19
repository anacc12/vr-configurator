"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { localDB } from "@/lib/local-db"
import { isWorkEmail } from "@/lib/database"
import type { OrderUser } from "@/lib/database"

interface Step1UserDetailsProps {
  orderId: string
  onDataChange: () => void
  onValidationChange: (isValid: boolean) => void
}

export function Step1UserDetails({ orderId, onDataChange, onValidationChange }: Step1UserDetailsProps) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
  })
  const [errors, setErrors] = useState({
    name: "",
    company: "",
    email: "",
  })
  const [touched, setTouched] = useState({
    name: false,
    company: false,
    email: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const lastSavedDataRef = useRef<string>("")
  const lastValidationRef = useRef<boolean | null>(null)

  useEffect(() => {
    // Load existing data
    const loadUserDetails = async () => {
      const userData = await localDB.getUserDetails(orderId)
      if (userData) {
        setFormData({
          name: userData.name,
          company: userData.company,
          email: userData.email,
        })
      }
      setIsLoading(false)
    }
    loadUserDetails()
  }, [orderId])

  useEffect(() => {
    if (isLoading) return

    const isValid = validateForm()

    if (lastValidationRef.current !== isValid) {
      lastValidationRef.current = isValid
      onValidationChange(isValid)
    }
  }, [formData, isLoading]) // Removed onValidationChange from dependencies to prevent infinite loop

  const validateForm = () => {
    const newErrors = {
      name: "",
      company: "",
      email: "",
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.length > 50) {
      newErrors.name = "Name must be 50 characters or less"
    }

    // Company validation
    if (!formData.company.trim()) {
      newErrors.company = "Company is required"
    } else if (formData.company.length > 50) {
      newErrors.company = "Company name must be 50 characters or less"
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    } else if (!isWorkEmail(formData.email)) {
      newErrors.email = "Please input your work/business email"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error !== "")
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleInputBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleSave = async () => {
    if (validateForm()) {
      const userData: OrderUser = {
        orderId,
        name: formData.name.trim(),
        company: formData.company.trim(),
        email: formData.email.trim(),
      }
      await localDB.saveUserDetails(userData)
      onDataChange()
    }
  }

  useEffect(() => {
    if (isLoading) return

    const currentDataString = JSON.stringify(formData)
    if (lastSavedDataRef.current === currentDataString) return

    if (validateForm()) {
      const saveData = async () => {
        const userData: OrderUser = {
          orderId,
          name: formData.name.trim(),
          company: formData.company.trim(),
          email: formData.email.trim(),
        }
        await localDB.saveUserDetails(userData)
        lastSavedDataRef.current = currentDataString
      }
      saveData()
    }
  }, [formData, isLoading, orderId]) // Removed onDataChange() call to prevent infinite loops

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold mb-3">Your Details</h2>
      <p className="text-gray-600 mb-8">Please provide your contact information to get started.</p>

      <div className="space-y-6">
        <div>
          <Label htmlFor="name" className="mb-2 block">
            Your Name
          </Label>
          <Input
            id="name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            onBlur={() => handleInputBlur("name")}
            maxLength={50}
            className={errors.name && touched.name ? "border-red-500" : ""}
            placeholder="Enter your full name"
          />
          {errors.name && touched.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="company" className="mb-2 block">
            Your Company
          </Label>
          <Input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => handleInputChange("company", e.target.value)}
            onBlur={() => handleInputBlur("company")}
            maxLength={50}
            className={errors.company && touched.company ? "border-red-500" : ""}
            placeholder="Enter your company name"
          />
          {errors.company && touched.company && <p className="text-red-500 text-sm mt-1">{errors.company}</p>}
        </div>

        <div>
          <Label htmlFor="email" className="mb-2 block">
            Work Email
          </Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            onBlur={() => handleInputBlur("email")}
            className={errors.email && touched.email ? "border-red-500" : ""}
            placeholder="Enter your work email address"
          />
          {errors.email && touched.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>
      </div>
    </div>
  )
}
