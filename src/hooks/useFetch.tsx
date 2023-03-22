import React, { useEffect, useReducer, useRef } from "react";

type State<T> = {
  status: "loading" | "fetched" | "failed";
  data?: T;
  error?: Error;
};

type Action<T> =
  | { type: "loading" }
  | { type: "fetched"; payload: T }
  | { type: "error"; payload: Error };

function useFetch<T = unknown>(url?: string, options?: RequestInit): State<T> {
  const cancelRequest = useRef<boolean>(false);

  const initialState: State<T> = {
    status: "loading",
    error: undefined,
    data: undefined,
  };

  const fetchReducer = (state: State<T>, action: Action<T>): State<T> => {
    switch (action.type) {
      case "loading":
        return { ...initialState };
      case "fetched":
        return { ...initialState, status: "fetched", data: action.payload };
      case "error":
        return { ...initialState, status: "failed", error: action.payload };
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(fetchReducer, initialState);

  useEffect(() => {
    // Do nothing if the url is not given
    if (!url) return;
    cancelRequest.current = false;

    const fetchData = async () => {
      dispatch({ type: "loading" });

      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          const err = await response.json();
          console.log(err);
          throw new Error(response.statusText);
        }

        const data = (await response.json()) as T;
        if (cancelRequest.current) return;
        dispatch({ type: "fetched", payload: data });
      } catch (error) {
        if (cancelRequest.current) return;
        dispatch({ type: "error", payload: error as Error });
      }
    };

    fetchData();

    // Use the cleanup function for avoiding a possibly...
    // ...state update after the component was unmounted
    return () => {
      cancelRequest.current = true;
    };
  }, [url]);

  return state;
}

export default useFetch;
