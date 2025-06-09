/**
 * Servicio para enviar notificaciones a webhooks externos
 */

import { TaskNotification } from "@types"

const WEBHOOK_URL = "https://webhooks.pox.me/webhook/1a7295b9-5633-4ee2-a80e-93cc7afe6b1a"

/**
 * Envía una notificación al webhook cuando se crea una nueva tarea
 */
export async function notifyTaskCreated(taskData: TaskNotification): Promise<boolean> {
  try {
    console.log("Enviando notificación de tarea creada:", taskData)

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "task.created",
        timestamp: new Date().toISOString(),
        data: taskData,
      }),
    })

    if (!response.ok) {
      console.error("Error al enviar notificación:", await response.text())
      return false
    }

    console.log("Notificación enviada correctamente")
    return true
  } catch (error) {
    console.error("Error al enviar notificación:", error)
    return false
  }
}

/**
 * Envía una notificación al webhook cuando se actualiza una tarea
 */
export async function notifyTaskUpdated(taskData: TaskNotification): Promise<boolean> {
  try {
    console.log("Enviando notificación de tarea actualizada:", taskData)

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "task.updated",
        timestamp: new Date().toISOString(),
        data: taskData,
      }),
    })

    if (!response.ok) {
      console.error("Error al enviar notificación:", await response.text())
      return false
    }

    console.log("Notificación enviada correctamente")
    return true
  } catch (error) {
    console.error("Error al enviar notificación:", error)
    return false
  }
}
