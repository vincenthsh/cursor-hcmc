const ROOM_CODE_LENGTH = 6
const VALID_CHARS = /^[A-Z2-9]{6}$/

export const validateRoomCodeFormat = (code: string): boolean => {
  return VALID_CHARS.test(code)
}

export const formatRoomCodeInput = (input: string): string => {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH)
}

export const isRoomCodeComplete = (input: string): boolean => {
  return formatRoomCodeInput(input).length === ROOM_CODE_LENGTH
}
