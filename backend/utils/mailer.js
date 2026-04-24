import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

let transporters = null
let transporterCursor = 0

const buildSingleConfig = () => {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user || 'no-reply@example.com'

  if (!host || !user || !pass) return null
  return { host, port, user, pass, from }
}

const parsePoolFromJson = () => {
  const raw = process.env.SMTP_POOL_JSON
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        host: item?.host,
        port: Number(item?.port || 587),
        user: item?.user,
        pass: item?.pass,
        from: item?.from || item?.user || 'no-reply@example.com'
      }))
      .filter((cfg) => cfg.host && cfg.user && cfg.pass)
  } catch (error) {
    console.warn('SMTP_POOL_JSON không hợp lệ:', error.message)
    return []
  }
}

const parsePoolFromIndexedEnv = () => {
  const result = []

  for (let i = 1; i <= 20; i++) {
    const host = process.env[`SMTP_HOST_${i}`]
    const port = Number(process.env[`SMTP_PORT_${i}`] || 587)
    const user = process.env[`SMTP_USER_${i}`]
    const pass = process.env[`SMTP_PASS_${i}`]
    const from = process.env[`SMTP_FROM_${i}`] || user || 'no-reply@example.com'

    if (!host || !user || !pass) continue
    result.push({ host, port, user, pass, from })
  }

  return result
}

const getSmtpConfigs = () => {
  const fromJson = parsePoolFromJson()
  const fromIndexed = parsePoolFromIndexedEnv()

  if (fromJson.length > 0) return fromJson
  if (fromIndexed.length > 0) return fromIndexed

  const single = buildSingleConfig()
  return single ? [single] : []
}

const initTransporters = () => {
  // luôn đọc lại env khi chưa khởi tạo hoặc pool rỗng
  if (transporters && transporters.length > 0) return transporters

  const smtpConfigs = getSmtpConfigs()
  transporters = smtpConfigs.map((cfg) => ({
    from: cfg.from,
    transporter: nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: {
        user: cfg.user,
        pass: cfg.pass
      }
    })
  }))

  return transporters
}

const getNextTransport = () => {
  const pool = initTransporters()
  if (!pool || pool.length === 0) return null

  const selected = pool[transporterCursor % pool.length]
  transporterCursor = (transporterCursor + 1) % pool.length
  return selected
}

export const sendResetPasswordCode = async (toEmail, code) => {
  const selected = getNextTransport()

  if (!selected) {
    console.warn('SMTP chưa cấu hình. Mã reset (dev only):', { toEmail, code })
    return { ok: true, skipped: true }
  }

  await selected.transporter.sendMail({
    from: selected.from,
    to: toEmail,
    subject: 'Mã đặt lại mật khẩu - Ricky Baby',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 16px;">
        <h2 style="color:#334155;">Đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Ricky Baby.</p>
        <p>Mã xác thực của bạn là:</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #0ea5e9; margin: 12px 0;">${code}</div>
        <p>Mã có hiệu lực trong <strong>10 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu thao tác này, hãy bỏ qua email.</p>
      </div>
    `
  })

  return { ok: true }
}
