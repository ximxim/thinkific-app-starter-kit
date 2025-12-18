import { gql } from 'graphql-request';

/**
 * Query to fetch basic site information.
 * This is a simple query to verify the API connection is working.
 */
export const GET_SITE_INFO = gql`
  query GetSiteInfo {
    site {
      id
      name
      subdomain
      url
    }
  }
`;

/**
 * Query to fetch courses with pagination.
 * Note: Courses are accessed through the site object in Thinkific's GraphQL API.
 */
export const GET_COURSES = gql`
  query GetCourses($first: Int!, $after: String) {
    site {
      courses(first: $first, after: $after) {
        edges {
          node {
            id
            name
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

/**
 * Query to fetch a single course by ID.
 */
export const GET_COURSE_BY_ID = gql`
  query GetCourseById($id: ID!) {
    site {
      course(id: $id) {
        id
        name
      }
    }
  }
`;

// Type definitions for the queries
export interface SiteInfo {
  site: {
    id: string;
    name: string;
    subdomain: string;
    url: string;
  };
}

export interface Course {
  id: string;
  name: string;
}

export interface CoursesResponse {
  site: {
    courses: {
      edges: Array<{ node: Course }>;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
      };
    };
  };
}

export interface CourseByIdResponse {
  site: {
    course: Course;
  };
}
