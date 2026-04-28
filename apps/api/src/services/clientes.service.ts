import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../utils/bcrypt'
import { generateQRCode } from './qr.service'
import { getPaginationParams, buildPaginatedResult } from '../utils/pagination'

const prisma = new PrismaClient()

interface CreateClienteInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  birthDate?: string
  pin: string
  notes?: string
}

export async function getClientes(query: { page?: number; limit?: number; search?: string }) {
  const { page, limit, skip } = getPaginationParams(query)
  const where = query.search
    ? {
        OR: [
          { firstName: { contains: query.search } },
          { lastName: { contains: query.search } },
          { user: { email: { contains: query.search } } },
        ],
        deletedAt: null,
      }
    : { deletedAt: null }

  const [data, total] = await Promise.all([
    prisma.client.findMany({
      where,
      skip,
      take: limit,
      include: { user: { select: { email: true, isActive: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.client.count({ where }),
  ])

  return buildPaginatedResult(data, total, page, limit)
}

export async function getClienteById(id: string) {
  return prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      user: { select: { email: true, isActive: true } },
      memberships: { include: { package: true }, orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
}

export async function createCliente(data: CreateClienteInput) {
  const hashedPassword = await hashPassword(data.password)
  const hashedPin = await hashPassword(data.pin)
  const qrCode = generateQRCode()

  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: 'CLIENT',
      client: {
        create: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
          pin: hashedPin,
          qrCode,
          notes: data.notes,
        },
      },
    },
    include: { client: true },
  })
}

export async function updateCliente(id: string, data: Partial<CreateClienteInput>) {
  const updateData: Record<string, unknown> = {}
  if (data.firstName) updateData.firstName = data.firstName
  if (data.lastName) updateData.lastName = data.lastName
  if (data.phone !== undefined) updateData.phone = data.phone
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.pin) updateData.pin = await hashPassword(data.pin)

  return prisma.client.update({ where: { id }, data: updateData })
}

export async function deleteCliente(id: string) {
  return prisma.client.update({ where: { id }, data: { deletedAt: new Date() } })
}
