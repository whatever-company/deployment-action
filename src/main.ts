import * as core from "@actions/core";
import * as github from "@actions/github";

type DeploymentState =
  | "error"
  | "failure"
  | "inactive"
  | "in_progress"
  | "queued"
  | "pending"
  | "success";

async function run() {
  try {
    const context = github.context;
    const runId = core.getInput("run_id", { required: false });
    const defaultUrl = runId
      ? `https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${runId}`
      : "";
    const token = core.getInput("token", { required: true });
    const url = core.getInput("target_url", { required: false }) || defaultUrl;
    const ref = (
      core.getInput("ref", { required: false }) || context.ref
    ).replace("refs/heads/", "");
    const environment =
      core.getInput("environment", { required: false }) || "production";
    const description = core.getInput("description", { required: false });
    const initialStatus =
      (core.getInput("initial_status", {
        required: false
      }) as DeploymentState) || "pending";
    const autoMergeStringInput = core.getInput("auto_merge", {
      required: false
    });

    const auto_merge: boolean = autoMergeStringInput === "true";

    const transient_environment: boolean =
      core.getInput("transient_environment", {
        required: false
      }) === "true";

    const client = new github.GitHub(token, { previews: ["flash", "ant-man"] });

    const deployment = await client.repos.createDeployment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      ref,
      required_contexts: [],
      environment,
      transient_environment,
      auto_merge,
      description
    });

    await client.repos.createDeploymentStatus({
      ...context.repo,
      deployment_id: deployment.data.id,
      state: initialStatus,
      log_url: defaultUrl
    });

    core.setOutput("deployment_id", deployment.data.id.toString());
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

run();
