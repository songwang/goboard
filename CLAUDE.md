# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production (runs TypeScript compilation then Vite build)
- `npm run lint` - Run ESLint for code quality checks
- `npm run preview` - Preview production build locally

## Project Architecture

This is a React + TypeScript + Vite application implementing a Go game board with two main architectural components:

### Core Go Game Logic (`src/GoGame.ts`)
- **GoGame class**: Complete Go game engine with game rule validation
- **Key types**: `Vertex` for board coordinates, `Sign` for stone colors (-1, 0, 1), `SignMap` for board state
- **Core methods**: `makeMove()`, `analyzeMove()`, `hasLiberties()`, `getChain()`, `getLiberties()`
- **Features**: Ko rule detection, suicide prevention, capture logic, handicap stone placement
- **Board representation**: Uses coordinate system [x, y] where (0,0) is top-left

### React UI Component (`src/App.tsx`)
- **GoBoard component**: Visual board implementation using HTML/CSS grid layout  
- **Stone representation**: Styled div elements with gradients for realistic stone appearance
- **Interactive features**: Click to place stones, hover effects, coordinate display
- **Board sizes**: Supports 9x9, 13x13, 19x19 with appropriate star point positioning
- **State management**: Uses React hooks for stone placement and turn tracking

### Key Integration Points
- The React component maintains its own simple stone state for UI rendering
- The GoGame class provides the complete game logic but is not yet integrated with the UI
- Coordinate systems may need alignment: GoGame uses mathematical coordinates while UI uses grid positioning

## Technology Stack
- **React 19**: UI framework with functional components and hooks
- **TypeScript**: Type safety throughout
- **Vite**: Build tool and dev server  
- **ESLint**: Code linting with React-specific rules
- **CSS-in-JS**: Inline styles for component styling