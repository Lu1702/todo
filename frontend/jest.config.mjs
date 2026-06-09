import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

// Cấu hình custom cho Jest
/** @type {import('jest').Config} */
const config = {
  // Chỉ định file setup chạy trước mỗi bài test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Giả lập môi trường trình duyệt để test giao diện
  testEnvironment: 'jest-environment-jsdom',
}

export default createJestConfig(config)