# Curbside - The Best Chicken on Campus

Curbside is a modern, full-stack web application designed for students to pre-order fresh chicken for delivery. It provides a seamless ordering experience for customers and a comprehensive dashboard for administrators to manage the business. The app is built with a focus on user experience, performance, and security.

## Core Features

- **Dynamic Order Form**: Users can easily customize their order by choosing between whole chickens or pieces. The price updates in real-time based on their selection.
- **Pay on Delivery**: All orders are handled on a "pay on delivery" basis, simplifying the transaction process.
- **Flexible Delivery Options**: The form intelligently adapts to collect on-campus (school, block, room) or off-campus (area, street, house number) delivery details.
- **User Authentication**: Secure user sign-up and login functionality using Firebase Authentication. Users can create an account and view their order history.
- **Order History**: Logged-in users can view a history of their past and pending orders, track their status (`Pending`, `Ready for Pickup`, `Delivered`).
- **Responsive Design**: The application is fully responsive and provides a great user experience on both desktop and mobile devices.

### Admin Dashboard

A secure, role-protected admin section is available for the business owner (`bwezanijuma@gmail.com`).

- **Sales Analytics**: A dashboard with charts visualizing order volume over selectable date ranges.
- **Order Management**: Administrators can view all open and completed orders. They can update the status of an order to "Delivered".
- **Delivery Settings**: Admins can set and update the next available delivery date, which is displayed to customers on the order form.

## Tech Stack

This project is built with a modern, production-ready tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://reactjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Backend & Database**: [Firebase](https://firebase.google.com/) (Firebase Authentication and Cloud Firestore)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for schema validation.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or later)
- npm or yarn

### Installation & Running Locally

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    ```
2.  **Install NPM packages:**
    ```sh
    npm install
    ```
3.  **Set up Firebase:**
    - Create a new project in the [Firebase Console](https://console.firebase.google.com/).
    - Add a new Web App to your project.
    - Copy your Firebase configuration object and paste it into `src/lib/firebase/config.ts`.
    - In the Firebase Console, go to **Firestore Database** -> **Rules**. Copy the contents of the `firestore.rules` file in the project root and paste them into the rules editor.

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.
