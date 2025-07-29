"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { BellRing, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"

// Define notification types
const notificationCategories = [
  {
    id: "taskAssigned",
    title: "Task Assigned",
    description: "When a task is assigned to you",
  },
  {
    id: "taskUpdated",
    title: "Task Updated",
    description: "When a task you're involved with is updated",
  },
  {
    id: "taskCompleted",
    title: "Task Completed",
    description: "When a task is marked as completed",
  },
  {
    id: "reminder",
    title: "Reminders",
    description: "Upcoming deadlines and scheduled items",
  },
  {
    id: "mention",
    title: "Mentions",
    description: "When someone mentions you in comments",
  },
  {
    id: "comment",
    title: "Comments",
    description: "When someone comments on your item",
  },
  {
    id: "documentShared",
    title: "Document Shared",
    description: "When someone shares a document with you",
  },
  {
    id: "documentUpdated",
    title: "Document Updated",
    description: "When a shared document is updated",
  },
  {
    id: "meeting",
    title: "Meeting Notifications",
    description: "Meeting invites and updates",
  },
  {
    id: "system",
    title: "System Notifications",
    description: "Important system alerts and updates",
  },
]

// Define delivery methods
const deliveryMethods = [
  { id: "inApp", label: "In-app" },
  { id: "email", label: "Email" },
  { id: "mobile", label: "Mobile Push" },
]

// Define form schema
const notificationFormSchema = z.object({
  enabled: z.record(z.boolean()),
  deliveryMethods: z.record(z.array(z.string())),
  quietHoursEnabled: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
})

type NotificationFormValues = z.infer<typeof notificationFormSchema>

export function NotificationSettings() {
  // Initialize default values for the form
  const defaultValues: Partial<NotificationFormValues> = {
    enabled: Object.fromEntries(
      notificationCategories.map((category) => [category.id, true])
    ),
    deliveryMethods: Object.fromEntries(
      notificationCategories.map((category) => [category.id, ["inApp"]])
    ),
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
  }

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues,
  })

  function onSubmit(data: NotificationFormValues) {
    toast.success("Notification settings saved")
    console.log(data)
  }

  function sendTestNotification() {
    toast.success("Test notification sent!", {
      description: "This is how your notifications will appear in the app.",
      icon: <BellRing className="h-4 w-4" />,
      duration: 5000,
    })
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Notification Categories</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose which notifications you want to receive and how.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={sendTestNotification}
                className="flex items-center gap-1"
              >
                <BellRing className="h-4 w-4" />
                Test Notification
              </Button>
            </div>

            <div className="space-y-4">
              {notificationCategories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`enabled.${category.id}`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">{category.title}</FormLabel>
                                <FormDescription>
                                  {category.description}
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-3 flex items-start">
                        <FormField
                          control={form.control}
                          name={`deliveryMethods.${category.id}`}
                          render={({ field }) => (
                            <FormItem className="space-y-1 w-full">
                              <FormLabel className="text-sm">Delivery Methods</FormLabel>
                              {form.watch(`enabled.${category.id}`) ? (
                                <div className="grid grid-cols-3 gap-2">
                                  {deliveryMethods.map((method) => (
                                    <FormItem
                                      key={method.id}
                                      className="flex flex-row items-start space-x-2 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(method.id)}
                                          onCheckedChange={(checked) => {
                                            const currentValues = field.value || []
                                            if (checked) {
                                              field.onChange([...currentValues, method.id])
                                            } else {
                                              field.onChange(
                                                currentValues.filter((value) => value !== method.id)
                                              )
                                            }
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {method.label}
                                      </FormLabel>
                                    </FormItem>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-sm text-muted-foreground italic">
                                  Enable notifications to set delivery methods
                                </div>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex flex-row items-center space-x-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-medium">Quiet Hours</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4 mt-0.5 pl-7">
              Set a time period when notifications will be silenced.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <FormField
                    control={form.control}
                    name="quietHoursEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between space-x-3 space-y-0">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Quiet Hours</FormLabel>
                          <FormDescription>
                            Silence notifications during specified hours
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {form.watch("quietHoursEnabled") && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <FormField
                        control={form.control}
                        name="quietHoursStart"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quietHoursEnd"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardContent className="p-4 flex flex-col justify-center h-full">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <BellRing className="h-5 w-5" />
                    <p className="text-sm">
                      {form.watch("quietHoursEnabled")
                        ? `Notifications will be silenced between ${form.watch("quietHoursStart")} and ${form.watch("quietHoursEnd")} every day. You'll still receive them when you return.`
                        : "Quiet hours are currently disabled. Enable them to silence notifications during specific times."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Button type="submit">Save Notification Preferences</Button>
        </form>
      </Form>
    </div>
  )
}
