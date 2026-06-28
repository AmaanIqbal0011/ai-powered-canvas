/**
 * Mock project data for the editor workspace.
 *
 * Used during development before API/persistence is wired in.
 * Do not add real API calls or persistence here.
 */

import { slugify } from "@/lib/utils";

export interface MockProject {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerName: string;
}

export const MOCK_CURRENT_USER_ID = "user_2abc123";

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "proj_1",
    name: "E-commerce Platform",
    slug: "e-commerce-platform",
    ownerId: "user_2abc123",
    ownerName: "You",
  },
  {
    id: "proj_2",
    name: "API Gateway Design",
    slug: "api-gateway-design",
    ownerId: "user_2abc123",
    ownerName: "You",
  },
  {
    id: "proj_3",
    name: "Payment Service",
    slug: "payment-service",
    ownerId: "user_other_456",
    ownerName: "Alex Chen",
  },
  {
    id: "proj_4",
    name: "Notification System",
    slug: "notification-system",
    ownerId: "user_other_789",
    ownerName: "Sam Wilson",
  },
  {
    id: "proj_5",
    name: "User Authentication Flow",
    slug: "user-authentication-flow",
    ownerId: "user_2abc123",
    ownerName: "You",
  },
];

export { slugify };
