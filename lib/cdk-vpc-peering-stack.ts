import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkVpcPeeringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc1 = new ec2.Vpc(this, "VPC1", {
      cidr: "10.1.0.0/16",
      maxAzs: 1,
      vpcName: "VPC1",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "VPC1-Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });
    const vpc2 = new ec2.Vpc(this, "VPC2", {
      cidr: "10.2.0.0/16",
      maxAzs: 1,
      vpcName: "VPC2",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "VPC2-Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });
    const vpc3 = new ec2.Vpc(this, "VPC3", {
      cidr: "10.3.0.0/16",
      maxAzs: 1,
      vpcName: "VPC3",
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "VPC3-Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    const vpcPeeringConnection1to2 = new ec2.CfnVPCPeeringConnection(
      this,
      "VPCPeeringConnection1to2",
      {
        peerVpcId: vpc2.vpcId,
        vpcId: vpc1.vpcId,
      }
    );
    const vpcPeeringConnection2to3 = new ec2.CfnVPCPeeringConnection(
      this,
      "VPCPeeringConnection2to3",
      {
        peerVpcId: vpc3.vpcId,
        vpcId: vpc2.vpcId,
      }
    );
    const vpcPeeringConnection3to1 = new ec2.CfnVPCPeeringConnection(
      this,
      "VPCPeeringConnection3to1",
      {
        peerVpcId: vpc1.vpcId,
        vpcId: vpc3.vpcId,
      }
    );

    vpc1.publicSubnets.map(
      (subnet) =>
        new ec2.CfnRoute(this, "VPC1Route1to2", {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: vpc2.vpcCidrBlock,
          vpcPeeringConnectionId: vpcPeeringConnection1to2.ref,
        })
    );
    vpc1.publicSubnets.map(
      (subnet) =>
        new ec2.CfnRoute(this, "VPC1Route1to3", {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: vpc3.vpcCidrBlock,
          vpcPeeringConnectionId: vpcPeeringConnection3to1.ref,
        })
    );
    vpc2.publicSubnets.map(
      (subnet) =>
        new ec2.CfnRoute(this, "VPC2Route2to3", {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: vpc3.vpcCidrBlock,
          vpcPeeringConnectionId: vpcPeeringConnection2to3.ref,
        })
    );
    vpc2.publicSubnets.map(
      (subnet) =>
        new ec2.CfnRoute(this, "VPC2Route2to1", {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: vpc1.vpcCidrBlock,
          vpcPeeringConnectionId: vpcPeeringConnection1to2.ref,
        })
    );
    vpc3.publicSubnets.map(
      (subnet) =>
        new ec2.CfnRoute(this, "VPC3Route3to1", {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: vpc1.vpcCidrBlock,
          vpcPeeringConnectionId: vpcPeeringConnection3to1.ref,
        })
    );
    vpc3.publicSubnets.map(
      (subnet) =>
        new ec2.CfnRoute(this, "VPC3Route3to2", {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: vpc2.vpcCidrBlock,
          vpcPeeringConnectionId: vpcPeeringConnection2to3.ref,
        })
    );

    const securityGroup1 = new ec2.SecurityGroup(this, "SecurityGroup1", {
      vpc: vpc1,
      securityGroupName: "SecurityGroup1",
    });
    securityGroup1.addIngressRule(
      ec2.Peer.ipv4("10.3.0.0/24"),
      ec2.Port.allTraffic()
    );
    securityGroup1.addIngressRule(
      ec2.Peer.ipv4("10.2.0.0/24"),
      ec2.Port.allTraffic()
    );
    securityGroup1.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    const securityGroup2 = new ec2.SecurityGroup(this, "SecurityGroup2", {
      vpc: vpc2,
      securityGroupName: "SecurityGroup2",
    });
    securityGroup2.addIngressRule(
      ec2.Peer.ipv4("10.1.0.0/24"),
      ec2.Port.allTraffic()
    );
    securityGroup2.addIngressRule(
      ec2.Peer.ipv4("10.3.0.0/24"),
      ec2.Port.allTraffic()
    );
    securityGroup2.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    const securityGroup3 = new ec2.SecurityGroup(this, "SecurityGroup3", {
      vpc: vpc3,
      securityGroupName: "SecurityGroup3",
    });
    securityGroup3.addIngressRule(
      ec2.Peer.ipv4("10.1.0.0/24"),
      ec2.Port.allTraffic()
    );
    securityGroup3.addIngressRule(
      ec2.Peer.ipv4("10.2.0.0/24"),
      ec2.Port.allTraffic()
    );
    securityGroup3.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22));
    const iamRoleForEc2Instance2 = new iam.Role(
      this,
      "IAMRoleForEc2Instance2",
      {
        assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      }
    );
    iamRoleForEc2Instance2.addToPrincipalPolicy(
      iam.PolicyStatement.fromJson({
        Effect: "Allow",
        Action: [
          "ssm:GetServiceSetting",
          "ssm:ResetServiceSetting",
          "ssm:UpdateServiceSetting",
        ],
        Resource: "*",
      })
    );

    const cfnKeyPair = new ec2.CfnKeyPair(this, "KeyPairForVPCPeering", {
      keyName: "keypair-for-vpc-peering",
    });
    cfnKeyPair.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    new cdk.CfnOutput(this, "GetSSHKeyCommand", {
      value: `aws ssm get-parameter --name /ec2/keypair/${cfnKeyPair.getAtt(
        "KeyPairId"
      )} --region ${
        this.region
      } --with-decryption --query Parameter.Value --output text`,
    });

    const ec2Instance1 = new ec2.Instance(this, "EC2Instance1", {
      vpc: vpc1,
      instanceType: new ec2.InstanceType("t2.micro"),
      machineImage: new ec2.AmazonLinuxImage(),
      associatePublicIpAddress: true,
      securityGroup: securityGroup1,
      keyPair: ec2.KeyPair.fromKeyPairName(
        this,
        `KeyPairForEC2Instance1`,
        cfnKeyPair.keyName
      ),
    });
    const ec2Instance2 = new ec2.Instance(this, "EC2Instance2", {
      vpc: vpc2,
      instanceType: new ec2.InstanceType("t2.micro"),
      machineImage: new ec2.AmazonLinuxImage(),
      associatePublicIpAddress: true,
      securityGroup: securityGroup2,
      keyPair: ec2.KeyPair.fromKeyPairName(
        this,
        "KeyPairForEC2Instance2",
        cfnKeyPair.keyName
      ),
    });
    const ec2Instance3 = new ec2.Instance(this, "EC2Instance3", {
      vpc: vpc3,
      instanceType: new ec2.InstanceType("t2.micro"),
      machineImage: new ec2.AmazonLinuxImage(),
      associatePublicIpAddress: true,
      securityGroup: securityGroup3,
      keyPair: ec2.KeyPair.fromKeyPairName(
        this,
        "KeyPairForEC2Instance3",
        cfnKeyPair.keyName
      ),
    });
    new cdk.CfnOutput(this, "EC2Instance1PublicIp", {
      value: ec2Instance1.instancePublicIp,
    });
    new cdk.CfnOutput(this, "EC2Instance1PrivateIp", {
      value: ec2Instance1.instancePrivateIp,
    });
    new cdk.CfnOutput(this, "EC2Instance2PublicIp", {
      value: ec2Instance2.instancePublicIp,
    });
    new cdk.CfnOutput(this, "EC2Instance2PrivateIp", {
      value: ec2Instance2.instancePrivateIp,
    });
    new cdk.CfnOutput(this, "EC2Instance3PublicIp", {
      value: ec2Instance3.instancePublicIp,
    });
    new cdk.CfnOutput(this, "EC2Instance3PrivateIp", {
      value: ec2Instance3.instancePrivateIp,
    });
  }
}
