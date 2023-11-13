import {
  getOutput,
  getPipeIssues,
  minLength,
  object,
  optional,
  string,
  url,
} from "valibot";

export const addLinkSchema = object({
  key: optional(
    string("Invalid key", [
      minLength(2, "Key must be at least 2 characters long"),
      (input) => {
        if (input.includes("/")) {
          return getPipeIssues("custom", "Key cannot contain '/'", input);
        }

        return getOutput(input);
      },
    ]),
  ),
  url: string("Invalid destionation url", [
    minLength(1, "Missing destination url"),
    url("Invalid destination url"),
  ]),
});
