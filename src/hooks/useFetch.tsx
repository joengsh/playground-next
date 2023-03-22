// This is a custom hook for fetching data via HTTP requests
// It takes a url string as input and returns a state object
// The state object contains the following properties:
// - status: indicates the status of the fetch (idle, loading, fetched, failed)
// - data: contains the fetched data (if successful)
// - error: contains any error that occurred (if failed)
//
// The state is managed using the useReducer hook
// Requests are sent using the useEffect hook
// Cancelling of requests is done using the useRef hook
// Caching of successful requests is also done using the useRef hook
//
// To use this hook, import it and call it with the url string parameter
// Example: const {status, data, error} = useFetch<MyData>("https://www.example.com/mydata")

import { useState, useEffect, useReducer, useRef } from "react";

// Defining generic types for state and action
type State<T> = {
  status: "idle" | "loading" | "fetched" | "failed"; // status of the fetching process
  data?: T; // data fetched from the API response
  error?: Error; // error (if any) occurred while fetching data
};

type Action<T> =
  | { type: "request" }
  | { type: "success"; payload: T }
  | { type: "failure"; payload: Error };

// Defining custom hook
function useFetch<T = unknown>(url: string): State<T> {
  // Using useRef to store cache and cancelRequest
  const cache = useRef<{ [url: string]: T }>({});
  const cancelRequest = useRef<boolean>(false);
  // Using useState to store the status
  const [status, setStatus] = useState<State<T>>({
    status: "idle",
    data: undefined,
    error: undefined,
  });

  // Applying reducer to handle state change
  const fetchReducer = (state: State<T>, action: Action<T>): State<T> => {
    switch (action.type) {
      case "request":
        return { ...state, status: "loading" }; // start loading
      case "success":
        return {
          ...state,
          status: "fetched",
          data: action.payload,
          error: undefined,
        }; // successfully fetched data
      case "failure":
        return { ...state, status: "failed", error: action.payload }; // failed to fetch data
      default:
        return state;
    }
  };
  // Using useReducer to manage state transitions
  const [state, dispatch] = useReducer(fetchReducer, {
    status: "idle",
    error: undefined,
    data: undefined,
  });

  useEffect(() => {
    // Do nothing if the url is not given
    if (!url) return;
    const fetchData = async () => {
      dispatch({ type: "request" }); // dispatching request action
      if (cache.current[url]) {
        dispatch({ type: "success", payload: cache.current[url] });
        return;
      }
      try {
        // fetching data from the url
        const response = await fetch(url);
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message);
        }
        const data = (await response.json()) as T;
        cache.current[url] = data; // caching data
        if (cancelRequest.current) return;
        dispatch({ type: "success", payload: data }); // dispatching success action
      } catch (error) {
        if (cancelRequest.current) return;
        dispatch({ type: "failure", payload: error as Error }); // dispatching failure action
      }
    };
    // fetching data asynchronously
    fetchData();
    // Use the cleanup function for avoiding a possibly...
    // ...state update after the component was unmounted
    return () => {
      cancelRequest.current = true; // Cancelling request to prevent unwanted component state updates
    };
  }, [url]);

  return state; // returning final state
}

export default useFetch; // exporting the custom hook.
